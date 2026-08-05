// backend/src/models/Chore.js
const mongoose = require("mongoose");

const choreSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		description: { type: String },

		// who this chore belongs to (household)
		householdCode: { type: String, required: true },

		// who created it
		createdBy: { type: String, required: true }, // email or name

		// assignee (can be empty = shared chore)
		assignedTo: { type: String, default: "" }, // email or name

		dueDate: { type: Date, required: true },

		// once / daily / weekly / monthly
		frequency: {
			type: String,
			enum: ["once", "daily", "weekly", "monthly"],
			default: "once",
		},

		location: {
  type: String,
  default: "General"
},

priority: {
  type: String,
  enum: ["Low", "Medium", "High"],
  default: "Medium"
},

priorityReason: {
  type: String,
  default: ""
},

source: {
  type: String,
  default: "Manual"
},

		// completion info
		completed: { type: Boolean, default: false },
		completedAt: { type: Date },
		completedBy: { type: String },

		// For recurring chores: track which chore this was created from
		// This helps us identify and remove the "next instance" when undoing
		parentChoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Chore" },

		// optional: track last done for recurring chores (for history/analytics)
		lastCompletedAt: { type: Date },
		lastCompletedBy: { type: String },
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Chore", choreSchema);
