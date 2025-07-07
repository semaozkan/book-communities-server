import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "/images/default_community.png",
    },
    coverImage: {
      type: String,
      default: "/images/default_cover.png",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    pendingMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    rules: [
      {
        title: String,
        description: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    categories: [
      {
        name: String,
        description: String,
      },
    ],
    settings: {
      isPrivate: {
        type: Boolean,
        default: false,
      },
      allowMemberPosts: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: true,
      },
      allowComments: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    activeMeeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Topluluk adının benzersiz olmasını sağla
communitySchema.index({ name: 1 }, { unique: true });

// Topluluk silindiğinde ilgili postları da sil
communitySchema.pre("remove", async function (next) {
  try {
    await mongoose.model("Post").deleteMany({ community: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

const CommunityModel = mongoose.model("Community", communitySchema);

export default CommunityModel;
