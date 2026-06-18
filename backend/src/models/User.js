const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			unique: true,
			required: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
		},
		// invite code of the household they belong to
		householdCode: {
			type: String,
			default: null,
		},
	},
	{ timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
