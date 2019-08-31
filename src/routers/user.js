const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')
const router = new express.Router()

router.post('/users', async (req, res) => {
  const user = new User(req.body)

  try {
    await user.save()
    sendWelcomeEmail(user.email, user.name)
    // Here we would like to create a new method for an instance of the User collection.
    const token = await user.generateAuthToken()

    res.status(201).send({ user, token })
  } catch (e) {
    res.status(400).send(e)
  }
})

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    // Here we would like to create a new method for an instance of the User collection.
    const token = await user.generateAuthToken()
    // Instead of using the one below, we can keep the user as it is and use toJSON in
    // the user models.
    // res.send({ user: user.getPublicProfile(), token })
    res.send({ user, token })
  } catch (e) {
    res.status(400).send()
  }
})

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token
    })
    await req.user.save()

    res.status(200).send('You have been succesfully logged out!')
  } catch (e) {
    res.status(500).send()
  }
})

router.post('/users/logoutall', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()

    res.status(200).send('You have been succesfully logged out with all your devices!')
  } catch (e) {
    res.status(500).send()
  }
})

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})

// As we dont want to let the user get other user's info, we dont need this anymore:
// router.get('/users/:id', async (req, res) => {
//   const _id = req.params.id

//   try {
//     const user = await User.findById(_id)

//     if (!user) {
//       return res.status(404).send()
//     }

//     res.send(user)
//   } catch (e) {
//     res.status(500).send()
//   }
// })

// Patch is used for updating an existing resource 
router.patch('/users/me', auth, async (req, res) => {
  // Extracting the keys from the key/value pairs
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  // Checks every element of the array. If one assumption is false, the whole operation is false.
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update)
  })

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' })
  }

  try {
    // We have to change the code below so that the password is hashed again upon password change
    const user = req.user

    updates.forEach((update) => {
      user[update] = req.body[update]
    })

    await user.save()

    // new:true is going to return the updated entry instead of the original one
    // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    if (!user) {
      return res.status(404).send()
    }

    res.send(user)
  } catch (e) {
    res.status(400).send(e)
  }
})

router.delete('/users/me', auth, async (req, res) => {
  try {
    // As we use the middleware where the user is attached to the request, it can be
    // used here:

    // const user = await User.findByIdAndDelete(req.user._id)

    // if (!user) {
    //   return res.status(404).send()
    // }
    sendCancellationEmail(req.user.email, req.user.name)
    await req.user.remove()

    res.send(req.user)
  } catch (e) {
    res.status(500).send()
  }
})

// File uploads with multer!!

const upload = multer({
  // By removing the destination property multer will pass the data through to our function.
  // dest: 'avatars',
  limits: {
    // Needs to be in bytes:
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image with a .jpg/.jpeg or .png file extension!'))
    }

    cb(undefined, true)
  }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  // We are going to use sharp to auto-crop and format the image:
  const buffer = await sharp(req.file.buffer).resize({ width: 550, height: 550 }).png().toBuffer()

  // Saving the formatted buffer into the user collection
  req.user.avatar = buffer
  await req.user.save()

  res.status(200).send('File upload was succesful!')
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
  // Deleting the buffer from the user collection
  req.user.avatar = undefined
  await req.user.save()

  res.status(200).send('Avatar is deleted!')
})

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error()
    }

    // Setting a response header so that the image can be viewed by users (eg. in browser):
    res.set('Content-Type', 'image/jpg')

    res.send(user.avatar)
  } catch (e) {
    res.status(404).send()
  }
})

module.exports = router