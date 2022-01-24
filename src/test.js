const fs = require('fs');

let write = `\n123,123,123,123,123`
let file = fs.readFileSync('../src/txRecords/records.csv', 'utf8')
console.log(file);
file += write;
fs.writeFile('../src/txRecords/records.csv', file, 'utf8',(err)=>{
    if (err){
        console.log(err)
    }else{
        console.log('Data written successfully!')
    }
})