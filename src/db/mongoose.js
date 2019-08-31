const mongoose = require('mongoose')

// Database name is in the URL
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  // Makes sure that indexes are created to quickly access data
  useCreateIndex: true,
  useFindAndModify: false
})

// Making sure that the MongoDB Database works:
// const me = new User({
//   name: 'Tomi',
//   age: 27,
//   email: 'tomi112233@gmail.com',
//   password: 'nemmindegy'
// })

// // Saving the data into the database
// me.save().then(() => {
//   console.log(me)
// }).catch((error) => {
//   console.log('Error!', error)
// })

/////////////////////////////////++++++++++++++++++++++++///////////////////////////
/////Task model

// const newTask = new Task({
//   description: 'Cleaning out my closet'
// })

// newTask.save().then(() => {
//   console.log(newTask)
// }).catch((error) => {
//   console.log('Error!', error)
// })