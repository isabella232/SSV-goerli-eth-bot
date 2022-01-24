require('dotenv').config({path: '../.env'})
const { checkDeposit } = require('./api.js');
const { Pool } = require('pg');

let pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
})
pool.connect();

pool.query('SELECT NOW()', (err, res) => {
    if(err){
        console.log('Database connection failed',err);
    }
    else {
        console.log('Database connected!');
    }
  });

const createTable = `create table if not exists depositortest
(
    discordid         bigint not null constraint depositortest_pk primary key,
    address           varchar,
    norequests        integer,
    dailycount        real,
    weeklycount       real,
    firstrequesttime  timestamp,
    dailytime         timestamp,
    weeklytime        timestamp,
    validatedtx       varchar,
    unaccountedamount real,
    unaccountedtx     varchar
);`

const createLogTable = `create table if not exists txlogs(
    discord_id bigint,
    discord_name varchar,
    etherscan_link varchar,
    deposit_abi varchar,
    created_at timestamp
)
`

pool.query(createTable, (err, res) => {
    if(err){
        console.log('depositor table creation failed',err);
    }
    else {
        console.log('depositor table created!');
    }
});

pool.query(createLogTable, (err,res) =>{
    if(err){
        console.log('Log table initialization failed.')
    }
    else  {
        console.log('Log table initialized!')
    }
})

const depositAmount = process.env.DEPOSIT_AMOUNT; //should be 32000000000000000000
const dailyLimit = parseFloat(process.env.DAILY_LIMIT);
const weeklyLimit = parseFloat(process.env.WEEKLY_LIMIT);
const maxTries = 3;

module.exports = {
    confirmTransaction: async function(discordID, address, topUpAmount){
        //add try catch
        var count = 0
        while (true){
            try{
                var userDetails = (await checkUserExists(discordID));
                //console.log("Check account exists address details:",userDetails);
                //Assumes userDetails will always be an array
                if (!userDetails.length){
                    const userDetails = await setDepositor(discordID);
                    await updateCounts(userDetails, topUpAmount);
                    return true
                }
                userDetails = userDetails[0];
                if (userDetails.address !== address){
                    await updateAddress(discordid,address)
                    userDetails.address = address
                }
                //refresh daily limit and weekly limit 
                //check daily limit and weekly limit
                //If either are reached reject transaction
                if (!(await checkDailyLimit(userDetails))){
                    return false;
                }
                if (!(await checkWeeklyLimit(userDetails))){
                    return false;
                }
                //refresh norequests
                const norequests = await resetNoRequests(userDetails);
                if (norequests === 0){
                    await updateCounts(userDetails, topUpAmount);
                    return true
                }

                userDetails = (await checkUserExists(discordID))[0];
                userDetails.address = addressQuery[0].address;
                //noRequests > 1 now we have to validate that the user has sent 32 eth to the wallet
                return await validateTransaction(userDetails, topUpAmount);
            } catch (e) {
                console.log(e)
                if (++count == maxTries) return null;
            }
        }
    },
    addLog: async function(discord_id, discord_name, etherscan_link, deposit_abi){
        const now = new Date();
        const insert =   `INSERT INTO txlogs
                        (discord_id,discord_name,etherscan_link,deposit_abi,created_at) VALUES ($1,$2,$3,$4,$5);`
        const values = [discord_id,discord_name,etherscan_link,deposit_abi,now];
        await pool.query(insert,values);
    }
}

async function updateAddress(discordID, address){
    const query = `update depositertest set address=$1 where discordid=$2`
    const vals = [String(address), BigInt(discordID)]
    await pool.query(query, vals);
}

async function checkUserExists(discordID){
    const select = `
        SELECT * FROM depositortest dt inner join discordidaddress da on dt.discordid=da.discordid 
        WHERE dt.discordid = $1
    `;
        const value = [BigInt(discordID)]
        const result = await pool.query(select, value);
        return result.rows;
}

async function setDepositor(discordID, address){
    const now = new Date();
    const insert = `
        INSERT INTO depositortest 
            (discordid,address,norequests,dailyCount,weeklyCount,firstrequesttime,dailyTime,weeklyTime,validatedtx,unaccountedamount,unaccountedtx) 
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11);
        `
    const insertVals = [BigInt(discordID),address,1,0,0,now,now,now,"",0,""];
    await pool.query(insert, insertVals);

    const insert2 = `insert into discordidaddress(discordid, address) values ($1, $2)`
    const insertVals2 = [BigInt(discordID), String(address)]
    await pool.query(insert2, insertVals2)

    return {
        discordid: BigInt(discordID),
        address: address,
        norequests: 1,
        dailycount: 0,
        weeklycount: 0,
        firstrequesttime: now,
        dailytime: now,
        weeklytime: now,
        validatedTx: "",
        unaccountedamount: 0,
        unaccountedtx: ""
    };
}

async function checkDailyLimit(userDetails){
    const dailycount = await resetDailyCount(userDetails);
    console.log(dailycount);
    return dailycount <= dailyLimit;

}

async function resetDailyCount(userDetails){
    const now = new Date();
    // console.log(userDetails);
    const discordID = BigInt(userDetails.discordid);
    const dailytime = userDetails.dailytime;
    if ((Math.floor(now.getTime()/1000 - Math.floor(dailytime.getTime()/1000))) > 86400){
        //update
        console.log('Resetting...');
        const update = 'update depositortest set dailycount=0,dailytime=$1 where discordid= $2 returning dailycount'
        const values = [now, discordID]
        const dailycount = await pool.query(update,values);
        return dailycount.rows[0].dailycount; //daily limit has been reset
    }
    return userDetails.dailycount;
    

}

async function checkWeeklyLimit(userDetails){
    const weeklycount = await resetWeeklyCount(userDetails);
    return weeklycount <= weeklyLimit;
}

async function resetWeeklyCount(userDetails){
    const now = new Date();
    const discordID = BigInt(userDetails.discordid);
    const weeklytime = userDetails.weeklytime;

    if ((Math.floor(now.getTime()/1000 - Math.floor(weeklytime.getTime()/1000))) > 604800){
        //update
        const update = 'update depositortest set weeklycount=0,weeklytime=$1 where discordid= $2 returning weeklycount'
        const values = [now,discordID]
        const weeklycount = await pool.query(update,values);
        return weeklycount.rows[0].weeklycount; //weekly limit has been reset
    }
    return userDetails.weeklycount;
}

async function resetNoRequests(userDetails){
    // console.log(userDetails)
    const now = new Date();
    const discordID = BigInt(userDetails.discordid);
    const firstrequesttime = userDetails.firstrequesttime;
    if ((Math.floor(now.getTime()/1000 - Math.floor(firstrequesttime.getTime()/1000))) > 172800){
        //update
        const update = 'update depositortest set norequests=0,firstrequesttime=$1 where discordid= $2 returning norequests'
        const values = [now,discordID]
        const norequests = await pool.query(update,values);
        return norequests.rows[0].norequests; //daily limit has been reset
    }
    return userDetails.norequests;
}

async function updateCounts(userDetails, topUpAmount){
    var newDailyCount = Number(userDetails.dailycount + topUpAmount);
    var newWeeklyCount = Number(userDetails.weeklycount + topUpAmount);
    
    const update = 'update depositortest set dailycount= $1,weeklycount= $2 where discordid= $3';
    const values = [newDailyCount,newWeeklyCount, String(userDetails.discordid)];
    await pool.query(update,values);
}
  
async function objectRowUpdate(userDetails){
      const update = 'update depositortest set validatedtx= $1,unaccountedamount= $2, unaccountedtx= $3, dailycount= $4, weeklycount= $5 where discordid= $6';
      const values = [String(userDetails.validatedtx), Number(userDetails.unaccountedamount), String(userDetails.unaccountedtx), Number(userDetails.dailycount), Number(userDetails.weeklycount), String(userDetails.discordid)]
      const result = await pool.query(update, values);
  }

function getUnvalidatedTx(depositedTx, lastValidatedTx){
  let index = null;
  for (let i=0; i < depositedTx.length; i++){
    if (depositedTx[i].hash == lastValidatedTx){
      index = i;
    }
  }
  if (index){
    return depositedTx.slice(0, index);
  }else{
    return depositedTx;
  }
}

async function validateTransaction(userDetails, topUpAmount){   // make a column for unaccountedAmount in db
        let lastValidatedTx = userDetails.validatedtx;
        //console.log(userDetails.address);
        let depositedTx = getUnvalidatedTx((await checkDeposit(userDetails.address)), lastValidatedTx); // confirm checkDeposit.confirmTransaction function
        console.log(depositedTx);
        let depositComplete = false;
        if (depositedTx.length){
          if (lastValidatedTx){
            for (let i = 0; i < depositedTx.length; i++){
                if ((Number(depositedTx[i].amount) == depositAmount) && (depositedTx[i].hash != lastValidatedTx) && userDetails.unaccountedamount < Number(depositAmount)){
                depositComplete = true;
                userDetails.validatedtx = depositedTx[i].hash;
                userDetails.weeklycount += topUpAmount;
                userDetails.dailycount += topUpAmount;
                await objectRowUpdate(userDetails);
              }else if ((Number(depositedTx[i].amount) < depositAmount) && (depositedTx[i].hash != lastValidatedTx)){
                userDetails.unaccountedamount +=  Number(depositedTx[i].amount);
                userDetails.unaccountedtx = depositedTx[i].hash;
                await objectRowUpdate(userDetails);
              }else if ((Number(depositedTx[i].amount) > depositAmount) && (depositedTx[i].hash != lastValidatedTx)){
                userDetails.unaccountedtx = depositedTx[i].hash;
                userDetails.unaccountedamount += (Number(depositedTx[i].amount) - depositAmount);
                await objectRowUpdate(userDetails);
              }}}
          else{
            for (let i = 0; i < depositedTx.length; i++){
                if ((Number(depositedTx[i].amount) == depositAmount) && (depositedTx[i].hash != lastValidatedTx) && userDetails.unaccountedamount < depositAmount){
                depositComplete = true;
                userDetails.validatedtx = depositedTx[i].hash;
                userDetails.weeklycount += topUpAmount;
                userDetails.dailycount += topUpAmount;
                await objectRowUpdate(userDetails);
                depositComplete = true;
              }else if ((Number(depositedTx[i].amount) < depositAmount) && (depositedTx[i].hash != lastValidatedTx)){
                userDetails.unaccountedamount +=  Number(depositedTx[i].amount);
                userDetails.unaccountedtx = depositedTx[i].hash;
                await objectRowUpdate(userDetails);
              }else if ((Number(depositedTx[i].amount) > depositAmount) && (depositedTx[i].hash != lastValidatedTx)){
                userDetails.unaccountedtx = depositedTx[i].hash;
                userDetails.unaccountedamount += (Number(depositedTx[i].amount) - depositAmount);
                await objectRowUpdate(userDetails);
              }}}
          if ((userDetails.unaccountedamount >= depositAmount) && !(depositComplete)){
            userDetails.unaccountedamount -= depositAmount;
            userDetails.validatedtx = userDetails.unaccountedtx;
            userDetails.unaccountedtx = '';
            userDetails.weeklycount += depositAmount;
            userDetails.dailycount += depositAmount;
            depositComplete = true;
            await objectRowUpdate(userDetails);
          } 
          console.log(userDetails);
          return depositComplete;
        }else{
          return false;
      }
  }
