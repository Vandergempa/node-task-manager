const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })
  try {
    await task.save()
    res.status(201).send(task)
  } catch (e) {
    res.status(400).send(e)
  }
})

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
  try {
    // Another way is to populate the virtual tasks property in the user collection: 

    // const match = {}

    // As anything provided as query strings is a string, we have to convert it to bolean:
    // if (req.query.completed) {
    //   match.completed = req.query.completed === 'true'
    // }

    // if (req.query.sortBy) {
    //   const parts = req.query.sortBy.split(':')
    //   sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    // }

    // await req.user.populate({
    //   path: 'tasks',
    //   match: match,
    //   options: {
    //     limit: parseInt(req.query.limit),
    //     skip: parseInt(req.query.skip),
    //     sort: {
    //       createdAt: -1
    //     }
    //   }
    // }).execPopulate()
    // res.send(req.user.tasks)

    // FILTERING AND PAGINATION WITH MONGOOSE!!!:
    const findCriteria = { owner: req.user._id }
    let limit = null
    let skip = null
    let sort = {}

    // Filtering by completed or not completed:
    if (req.query.completed) {
      findCriteria.completed = req.query.completed === 'true'
    }
    // Paginating the tasks:
    req.query.limit && (limit = parseInt(req.query.limit))
    req.query.skip && (skip = parseInt(req.query.skip))
    // Sorting the tasks:
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':')
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    const tasks = await Task.find(findCriteria, null, { limit: limit, skip: skip, sort: sort })

    res.send(tasks)
  } catch (e) {
    res.status(500).send(e)
  }
})

router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id

  try {
    // Only get the tasks back if i am the owner of them.
    const task = await Task.findOne({ _id, owner: req.user._id })

    if (!task) {
      return res.status(404).send('Empty task list and/or lacking permission for operation')
    }

    res.send(task)
  } catch (e) {
    res.status(500).send(e)
  }
})

// Patch is used for updating an existing resource 
router.patch('/tasks/:id', auth, async (req, res) => {
  // Extracting the keys from the key/value pairs
  const updates = Object.keys(req.body)
  const allowedUpdates = ['completed', 'description']
  // Checks every element of the array. If one assumption is false, the whole operation is false.
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update)
  })

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

    // new:true is going to return the updated entry instead of the original one
    // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    if (!task) {
      return res.status(404).send()
    }

    updates.forEach((update) => {
      task[update] = req.body[update]
    })
    // After all the operations are done, we save the collection.
    await task.save()

    res.send(task)
  } catch (e) {
    res.status(400).send(e)
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

    if (!task) {
      return res.status(404).send()
    }

    res.send(task)
  } catch (e) {
    res.status(500).send()
  }
})

module.exports = router