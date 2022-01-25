
require('dotenv').config({path: '../.env'})
//const { checkDeposit } = require('./api.js');
const { Pool } = require('pg');
//const { max } = require('pg/lib/defaults');

let pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
})
pool.connect();

const createLogTable = `create table if not exists txlogs(
    discord_id bigint,
    discord_name varchar,
    pub_key    varchar,
    etherscan_link varchar,
    deposit_abi varchar,
    created_at timestamp
)
`

pool.query(createLogTable, (err, res) =>{
    if(err){
        console.log('Log table initialization failed.')
    }
    else  {
        console.log('Log table initialized!')
    }
})