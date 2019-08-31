const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('Email is invalid!')
      }
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    trim: true,
    validate(value) {
      if (value.toLowerCase().includes('password')) {
        throw new Error('The word password can not be used as a password')
      }
    }
  },
  age: {
    type: Number,
    default: 0,
    //Setting up a custom validator:
    validate(value) {
      if (value < 0) {
        throw new Error('Age must be a positive number')
      }
    }
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  avatar: {
    type: Buffer
  }
}, {
    // Adds createdAt and updatedAt fields to the collection.
    timestamps: true
  })

// Setting up a virtual property. It is a relationship between two entitites, not an actual
// entry in the database.
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'owner'
})

// Method to hide sensitive data/heavy data like password and tokens or binaries.
// toJSON or creating a new method, like getPublicProfile()
userSchema.methods.toJSON = function () {
  const user = this
  // This is gonna give us the raw profile data:
  const userObject = user.toObject()

  // Mongoose commands to delete:
  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar

  return userObject
}

userSchema.methods.generateAuthToken = async function () {
  const user = this
  // Two arguments are needed: the object contains the data thats gonna be embedded in the token
  // For us its gonna be a unique identifier, the userid itself.
  // The second argument is a secret making sure that the token hasnt been altered or tampered with.
  // Third argument is optional: { expiresIn: '10 seconds' }
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

  // In case we generate more tokens for one user from multiple devices.
  user.tokens = user.tokens.concat({ token: token })
  await user.save()

  return token
}

// We define a new findBy*****anything method which will be used in the routers:
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email: email })

  if (!user) {
    throw new Error('Unable to login!')
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    throw new Error('Unable to login!')
  }

  return user
}

// The point of this is to run some code before the user is saved; to hash the plain text password before saving:
// The second argument needs to be a normal function because of the this binding
userSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password')) {
    // 8 rounds is required by the original creater of the module
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

// Delete user tasks when user is removed:

userSchema.pre('remove', async function (next) {
  const user = this
  await Task.deleteMany({ owner: user._id })

  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User