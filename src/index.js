const app = require('./app')
const port = process.env.PORT

// With middleware: new request => middleware does something => run route handler
// app.use((req, res, next) => {
//   if (req.method === 'GET') {
//     res.status(503).send('Site is under maintenance, please check back soon!')
//   } else {
//     next()
//   }
// })

app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`)
})

// const Task = require('./models/task')
// const User = require('./models/user')

// const main = async () => {
//   const task = await Task.findById('5d68e260c39f724644cef7c8')
//   // This method changes the owner property to the whole user profile (ref: User in task model!)
//   await task.populate('owner').execPopulate()
//   console.log(task.owner)

//   const user = await User.findById('5d68e18b23181849e827b7b8')
//   await user.populate('tasks').execPopulate()
//   console.log(user.tasks)
// }

// main()