/**
 * Mongoose Database Adapter
 */
const mongoose = require('mongoose');
const UserModel = require('../models/mongoose/user');
const TokenModel = require('../models/mongoose/token');

class MongooseAdapter {
  constructor(options = {}) {
    this.uri = options.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/authx';
    this.options = options.mongooseOptions || {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };
    this.models = {
      User: UserModel,
      Token: TokenModel
    };
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      await mongoose.connect(this.uri, this.options);
      console.log('Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      return true;
    } catch (error) {
      console.error('MongoDB disconnect error:', error);
      throw error;
    }
  }

  /**
   * Get a model by name
   * @param {String} modelName - The name of the model to get
   * @returns {Object} The model
   */
  getModel(modelName) {
    return this.models[modelName];
  }
}

module.exports = MongooseAdapter; 