import PostModel from "../models/PostModel.js";
import CommunityModel from "../models/CommunityModel.js";
import CommunityNotificationModel from "../models/CommunityNotificationModel.js";

// Get all posts for a community
export const getCommunityPosts = async (req, res) => {
  try {
    const posts = await PostModel.find({
      community: req.params.id,
      isActive: true,
    })
      .populate("author", "username profileImage")
      .populate("comments.user", "username profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a post
export const updatePost = async (req, res) => {
  try {
    const { content, image } = req.body;
    const post = await PostModel.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author
    if (post.author.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedPost = await PostModel.findByIdAndUpdate(
      req.params.postId,
      { content, image },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a post
export const deletePost = async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is the author or community admin
    const community = await CommunityModel.findById(post.community);
    if (
      post.author.toString() !== req.userId.toString() &&
      community.admin.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Soft delete
    post.isActive = false;
    await post.save();

    res.status(200).json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Like/Unlike a post
export const toggleLike = async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const likeIndex = post.likes.indexOf(req.userId);
    if (likeIndex === -1) {
      // Like the post
      post.likes.push(req.userId);
    } else {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create post in community
export const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    const community = await CommunityModel.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is a member
    if (!community.members.includes(req.userId)) {
      return res.status(403).json({ message: "Must be a member to post" });
    }

    const newPost = new PostModel({
      content,
      image,
      author: req.userId,
      community: community._id,
    });

    await newPost.save();
    community.posts.push(newPost._id);
    await community.save();

    // Bildirim yok (sadece admin post atabiliyor)

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add comment to post
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await PostModel.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = {
      user: req.userId,
      text,
    };

    post.comments.push(newComment);
    await post.save();

    // Bildirim: Post sahibine yeni yorum bildirimi
    if (post.author.toString() !== req.userId.toString()) {
      await CommunityNotificationModel.create({
        community: post.community,
        recipient: post.author,
        type: "NEW_COMMENT",
        content: "Gönderinize yeni bir yorum yapıldı.",
        relatedUser: req.userId,
        relatedPost: post._id,
        isRead: false,
      });
    }

    // Populate the new comment's user info
    const populatedPost = await PostModel.findById(post._id).populate(
      "comments.user",
      "username profileImage"
    );

    res.status(200).json(populatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const post = await PostModel.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is the comment author or post author
    if (
      comment.user.toString() !== req.userId.toString() &&
      post.author.toString() !== req.userId.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Yorum silme
    post.comments = post.comments.filter((c) => c._id.toString() !== commentId);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
