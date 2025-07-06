import CommunityModel from "../models/CommunityModel.js";
import PostModel from "../models/PostModel.js";
import CommunityNotificationModel from "../models/CommunityNotificationModel.js";
import User from "../models/UserModel.js";

// Create a new community
export const createCommunity = async (req, res) => {
  try {
    const { name, description, profileImage } = req.body;
    const admin = req.userId; // Kullanıcı kimliği artık req.userId

    const newCommunity = new CommunityModel({
      name,
      description,
      profileImage,
      admin,
      members: [admin], // Admin is automatically a member
    });

    await newCommunity.save();

    // Kullanıcının communities array'ine topluluk ID'sini ekle
    await User.findByIdAndUpdate(admin, {
      $push: { communities: newCommunity._id },
    });

    res.status(201).json(newCommunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all communities
export const getCommunities = async (req, res) => {
  try {
    const communities = await CommunityModel.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate("admin", "username profileImage")
      .populate("members", "username profileImage");
    res.status(200).json(communities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single community
export const getCommunity = async (req, res) => {
  try {
    const community = await CommunityModel.findById(req.params.id)
      .populate("admin", "username fullname profilePicture")
      .populate("members", "username fullname profilePicture")
      .populate("pendingMembers", "username fullname profilePicture")
      .populate({
        path: "posts",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "author",
          select: "username profileImage",
        },
      });

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    res.status(200).json(community);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update community
export const updateCommunity = async (req, res) => {
  try {
    const { name, description } = req.body;
    const community = await CommunityModel.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is admin
    if (community.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedCommunity = await CommunityModel.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );

    res.status(200).json(updatedCommunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request to join community
export const requestJoinCommunity = async (req, res) => {
  try {
    const community = await CommunityModel.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is already a member or has pending request
    if (
      community.members.includes(req.userId) ||
      community.pendingMembers.includes(req.userId)
    ) {
      return res
        .status(400)
        .json({ message: "Already a member or request pending" });
    }

    community.pendingMembers.push(req.userId);
    await community.save();

    // Bildirim: Admin'e katılım isteği bildirimi
    await CommunityNotificationModel.create({
      community: community._id,
      recipient: community.admin,
      type: "JOIN_REQUEST",
      content: "Topluluğa katılmak için yeni bir istek var.",
      relatedUser: req.userId,
      isRead: false,
    });

    res.status(200).json({ message: "Join request sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove Join Request
export const removeJoinRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const community = await CommunityModel.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    community.pendingMembers = community.pendingMembers.filter(
      (id) => id.toString() !== userId
    );
    await community.save();

    res.status(200).json({ message: "Join request removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept join request
export const acceptJoinRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const community = await CommunityModel.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is admin
    if (community.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Remove from pending and add to members
    community.pendingMembers = community.pendingMembers.filter(
      (id) => id.toString() !== userId
    );
    if (community.members.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User is already a member of the community" });
    }
    community.members.push(userId);
    await community.save();

    // Bildirim: Kullanıcıya kabul bildirimi
    await CommunityNotificationModel.create({
      community: community._id,
      recipient: userId,
      type: "JOIN_ACCEPTED",
      content: "Topluluğa katılım isteğiniz kabul edildi.",
      relatedUser: community.admin,
      isRead: false,
    });

    res.status(200).json({ message: "User added to community" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject join request by admin
export const rejectJoinRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const community = await CommunityModel.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is admin
    if (community.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Remove from pendingMembers
    community.pendingMembers = community.pendingMembers.filter(
      (id) => id.toString() !== userId
    );
    await community.save();

    // Notification: User rejection notification
    await CommunityNotificationModel.create({
      community: community._id,
      recipient: userId,
      type: "JOIN_REJECTED",
      content: "Topluluğa katılım isteğiniz reddedildi.",
      relatedUser: community.admin,
      isRead: false,
    });

    res.status(200).json({ message: "Join request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin removes a member from the community
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.body; // çıkarılacak üye
    const community = await CommunityModel.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Sadece admin işlem yapabilir
    if (community.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Admin kendini çıkaramaz
    if (userId === community.admin.toString()) {
      return res
        .status(400)
        .json({ message: "Admin cannot remove themselves" });
    }

    // Üyelerden çıkar
    const before = community.members.length;
    community.members = community.members.filter(
      (member) => member.toString() !== userId
    );
    if (community.members.length === before) {
      return res.status(400).json({ message: "User is not a member" });
    }
    await community.save();

    // Bildirim (opsiyonel): Kullanıcıya çıkarıldığına dair bildirim gönderilebilir

    res.status(200).json({ message: "Member removed from community" });
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

    // Bildirim: Tüm üyelere yeni gönderi bildirimi (yazan hariç)
    const memberIds = community.members.filter(
      (id) => id.toString() !== req.userId.toString()
    );
    await Promise.all(
      memberIds.map((memberId) =>
        CommunityNotificationModel.create({
          community: community._id,
          recipient: memberId,
          type: "NEW_POST",
          content: "Toplulukta yeni bir gönderi paylaşıldı.",
          relatedUser: req.userId,
          relatedPost: newPost._id,
          isRead: false,
        })
      )
    );

    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete community
export const deleteCommunity = async (req, res) => {
  try {
    const community = await CommunityModel.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is admin
    if (community.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Soft delete
    community.isActive = false;
    await community.save();

    res.status(200).json({ message: "Community deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search communities
export const searchCommunities = async (req, res) => {
  try {
    const { query, sortBy = "createdAt", order = "desc" } = req.query;

    const searchQuery = {
      isActive: true,
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };

    const communities = await CommunityModel.find(searchQuery)
      .populate("admin", "username profileImage")
      .populate("members", "username profileImage")
      .sort({ [sortBy]: order === "desc" ? -1 : 1 });

    res.status(200).json(communities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's communities
export const getUserCommunities = async (req, res) => {
  try {
    const userId = req.userId;

    const communities = await CommunityModel.find({
      $or: [{ admin: userId }, { members: userId }],
      isActive: true,
    })
      .populate("admin", "username profileImage")
      .populate("members", "username profileImage");

    res.status(200).json(communities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update community images
export const updateCommunityImages = async (req, res) => {
  try {
    const { profileImage, coverImage } = req.body;
    const community = await CommunityModel.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is admin
    if (community.admin.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedCommunity = await CommunityModel.findByIdAndUpdate(
      req.params.id,
      {
        ...(profileImage && { profileImage }),
        ...(coverImage && { coverImage }),
      },
      { new: true }
    );

    res.status(200).json(updatedCommunity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Leave community
export const leaveCommunity = async (req, res) => {
  try {
    const community = await CommunityModel.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is admin
    if (community.admin.toString() === req.userId.toString()) {
      return res
        .status(400)
        .json({ message: "Admin cannot leave the community" });
    }

    // Remove user from members
    community.members = community.members.filter(
      (member) => member.toString() !== req.userId.toString()
    );

    await community.save();

    // Bildirim: Eğer admin tarafından çıkarıldıysa (opsiyonel)
    // await CommunityNotificationModel.create({
    //   community: community._id,
    //   recipient: req.userId,
    //   type: "ADMIN_ACTION",
    //   content: "Bir topluluktan çıkarıldınız.",
    //   relatedUser: community.admin,
    //   isRead: false,
    // });
    res.status(200).json({ message: "Left community successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get community statistics
export const getCommunityStats = async (req, res) => {
  try {
    const community = await CommunityModel.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const stats = {
      totalMembers: community.members.length,
      pendingRequests: community.pendingMembers.length,
      totalPosts: community.posts.length,
      createdAt: community.createdAt,
      lastActivity: community.updatedAt,
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
