import MeetingModel from "../models/MeetingModel.js";
import CommunityModel from "../models/CommunityModel.js";
import User from "../models/UserModel.js";
import Book from "../models/BookModel.js";
import CommunityNotificationModel from "../models/CommunityNotificationModel.js";

// Toplantı başlat
export const startMeeting = async (req, res) => {
  try {
    const { communityId } = req.body;
    const admin = req.userId;
    // Topluluk kontrolü
    const community = await CommunityModel.findById(communityId);
    if (!community)
      return res.status(404).json({ message: "Community not found" });
    if (community.admin.toString() !== admin.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const activeMeeting = await MeetingModel.findOne({
      community: communityId,
      isActive: true,
    });
    if (activeMeeting)
      return res.status(400).json({ message: "Already active meeting exists" });
    const meeting = new MeetingModel({
      community: communityId,
      admin,
      participants: [admin],
      isActive: true,
    });
    await meeting.save();
    // Topluluğun activeMeeting alanını güncelle
    community.activeMeeting = meeting._id;
    await community.save();

    // Bildirim: Tüm üyelere yeni toplantı bildirimi (admin hariç)
    const memberIds = community.members.filter(
      (id) => id.toString() !== admin.toString()
    );
    await Promise.all(
      memberIds.map((memberId) =>
        CommunityNotificationModel.create({
          community: community._id,
          recipient: memberId,
          type: "MEETING_STARTED",
          content: "Toplulukta yeni bir toplantı başlatıldı.",
          relatedUser: admin,
          isRead: false,
        })
      )
    );

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toplantı bilgisi getir
export const getMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const meeting = await MeetingModel.findById(id)
      .populate("community", "name")
      .populate("admin", "username fullname profilePicture")
      .populate(
        "book",
        "title author time category translatedBy language img audioBookUrl audioSyncJsonUrl"
      )
      .populate("participants", "username fullname profilePicture")
      .populate({
        path: "chat.sender",
        select: "username fullname profilePicture",
      });

    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toplantıya katıl
export const joinMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const meeting = await MeetingModel.findById(id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    // Topluluğu bul ve üyelik kontrolü yap
    const community = await CommunityModel.findById(meeting.community);
    if (!community)
      return res.status(404).json({ message: "Community not found" });
    if (
      !community.members.map((m) => m.toString()).includes(userId.toString())
    ) {
      return res.status(403).json({
        message: "Topluluğun üyesi değilsiniz, toplantıya katılamazsınız.",
      });
    }

    if (!meeting.participants.includes(userId)) {
      meeting.participants.push(userId);
      await meeting.save();
    }
    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Katılımcının toplantıdan ayrılması
export const leaveMeeting = async (req, res) => {
  try {
    const { id } = req.params; // meeting id
    const userId = req.userId;
    const meeting = await MeetingModel.findById(id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    // Eğer admin ise ayrılmasına izin verme (isteğe bağlı)
    if (meeting.admin.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ message: "Admin toplantıdan ayrılamaz. Toplantıyı bitirin." });
    }

    // Katılımcıdan çıkar
    meeting.participants = meeting.participants.filter(
      (p) => p.toString() !== userId.toString()
    );
    await meeting.save();

    res.status(200).json({ message: "Meeting left successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toplantıyı bitir
export const endMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const meeting = await MeetingModel.findById(id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    if (meeting.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    meeting.isActive = false;
    meeting.endedAt = new Date();
    await meeting.save();
    // Topluluğun activeMeeting alanını null yap
    await CommunityModel.findByIdAndUpdate(meeting.community, {
      $set: { activeMeeting: null },
    });
    res.status(200).json({ message: "Meeting ended" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kitap ve audio seçimi
export const selectBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { bookId } = req.body;
    const meeting = await MeetingModel.findById(id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });
    meeting.book = bookId;
    await meeting.save();
    res.status(200).json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
