// const csvWriter = require('csv-writer').createObjectCsvWriter({
//     path: './records.csv',
//     header: [
//         {id: 'discord_id', title: 'DiscordID'},
//         {id: 'time', title: 'Date&Time'},
//         {id: 'methodABI', title: 'MethodABI'},
//         {id: 'transactionHash', title: 'TransactionHash'},
//         {id: 'etherscanLink', title: 'etherscanLink'}
//     ]
// });
//
const fs = require("fs");
const data = [{
    discord_id: 123,
    time: 123,
    methodABI: 123,
    transactionHash: 123,
    etherscanLink: 123
}];

let write = `\n123,123,123,123,123`
let file = fs.readFileSync('src/txRecords/records.csv', 'utf8')
console.log(file);
file += write;
fs.writeFile('./src/txRecords/records.csv', file, 'utf8',(err)=>{
    if (err){
        console.log(err)
    }else{
        console.log('Data written successfully!')
    }
})