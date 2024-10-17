const mongoose = require('mongoose')
const Local_Url = 'mongodb://127.0.0.1:27017/ADMISSION_PORTAL'

const connectDb = () => {
    return mongoose.connect(Local_Url)
    .then(()=>{
        console.log("Db connect hogya hai")
    }).catch((error)=>{
        console.log (error)
    })
}

module.exports=connectDb;


