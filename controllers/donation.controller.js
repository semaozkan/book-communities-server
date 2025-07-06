import Donation from "../models/DonationModel.js";
import User from "../models/UserModel.js";
import CommunityNotificationModel from "../models/CommunityNotificationModel.js";

// Tüm bağışları getir
export const getDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .sort({ createdAt: -1 })
      .populate("donor", "username fullname profilePicture")
      .populate("requesters.user", "username fullname profilePicture")
      .populate("selectedRequester", "username fullname profilePicture");

    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tek bir bağışı getir
export const getDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const donation = await Donation.findById(id)
      .populate("donor", "username fullname profilePicture")
      .populate("requesters.user", "username fullname profilePicture")
      .populate("selectedRequester", "username fullname profilePicture");

    if (!donation) {
      return res.status(404).json({ message: "Bağış bulunamadı" });
    }

    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Yeni bağış oluşturma
export const createDonation = async (req, res) => {
  try {
    const { book } = req.body;
    const donorId = req.userId;

    let donation = await Donation.create({
      book,
      donor: donorId,
      status: "pending",
    });

    // Kullanıcının pendingDonations listesine ekle
    await User.findByIdAndUpdate(donorId, {
      $push: { pendingDonations: donation._id },
    });

    // ✅ Donation'u donor ve diğer alanlarla birlikte geri döndür
    donation = await donation.populate([
      { path: "donor", select: "fullname username profilePicture" },
      { path: "requesters.user", select: "fullname username profilePicture" },
      { path: "selectedRequester", select: "fullname username profilePicture" },
    ]);

    res.status(201).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bağış talebi oluşturma
export const requestDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const userId = req.userId;

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: "Bağış bulunamadı" });
    }

    // Kullanıcı zaten talep etmiş mi kontrol et
    const existingRequest = donation.requesters.find(
      (req) => req.user.toString() === userId
    );

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "Bu bağış için zaten talep oluşturdunuz" });
    }

    // Talebi ekle
    donation.requesters.push({
      user: userId,
      status: "pending",
    });
    await donation.save();

    // Kullanıcının talep ettiği bağışlara ekle
    await User.findByIdAndUpdate(userId, {
      $push: { requestedDonations: donationId },
    });

    // Bildirim: Bağış sahibine yeni talep bildirimi
    await CommunityNotificationModel.create({
      community: null,
      recipient: donation.donor,
      type: "DONATION_REQUESTED",
      content: "Bağışınıza yeni bir talep geldi.",
      relatedUser: userId,
      isRead: false,
    });

    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bağış talebini iptal etme
export const cancelRequest = async (req, res) => {
  try {
    const { donationId } = req.params;
    const userId = req.userId;

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: "Bağış bulunamadı" });
    }

    // Talebi kaldır
    donation.requesters = donation.requesters.filter(
      (req) => req.user.toString() !== userId
    );
    await donation.save();

    // Kullanıcının talep ettiği bağışlardan kaldır
    await User.findByIdAndUpdate(userId, {
      $pull: { requestedDonations: donationId },
    });

    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bağışı tamamlama
export const completeDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { selectedRequesterId } = req.body;

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: "Bağış bulunamadı" });
    }

    // Seçilen talep edenin talebini kabul et
    const requester = donation.requesters.find(
      (req) => req.user.toString() === selectedRequesterId
    );

    if (!requester) {
      return res.status(400).json({
        message: "Seçilen kullanıcı bu bağış için talep oluşturmamış",
      });
    }

    requester.status = "accepted";

    // Diğer talepleri reddet
    donation.requesters.forEach((req) => {
      if (req.user.toString() !== selectedRequesterId) {
        req.status = "rejected";
        // Bildirim: Reddedilenlere
        CommunityNotificationModel.create({
          community: null,
          recipient: req.user,
          type: "DONATION_REJECTED",
          content: "Bağış talebiniz reddedildi.",
          relatedUser: donation.donor,
          isRead: false,
        });
      }
    });

    // Bağışı tamamlandı olarak işaretle
    donation.status = "completed";
    donation.selectedRequester = selectedRequesterId;
    donation.completionDate = new Date();
    await donation.save();

    // Bağışçının listelerini güncelle
    await User.findByIdAndUpdate(donation.donor, {
      $pull: { pendingDonations: donationId },
      $push: { completedDonations: donationId },
    });

    // Seçilen talep edenin listelerini güncelle
    await User.findByIdAndUpdate(selectedRequesterId, {
      $pull: { requestedDonations: donationId },
      $push: { receivedDonations: donationId },
    });

    // Bildirim: Kabul edilen kullanıcıya
    await CommunityNotificationModel.create({
      community: null,
      recipient: selectedRequesterId,
      type: "DONATION_ACCEPTED",
      content: "Bağış talebiniz kabul edildi.",
      relatedUser: donation.donor,
      isRead: false,
    });

    // Bildirim: Bağış tamamlandı (her iki tarafa)
    await CommunityNotificationModel.create({
      community: null,
      recipient: donation.donor,
      type: "DONATION_COMPLETED",
      content: "Bağış işlemi tamamlandı.",
      relatedUser: selectedRequesterId,
      isRead: false,
    });
    await CommunityNotificationModel.create({
      community: null,
      recipient: selectedRequesterId,
      type: "DONATION_COMPLETED",
      content: "Bağış işlemi tamamlandı.",
      relatedUser: donation.donor,
      isRead: false,
    });

    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bağışı iptal etme
export const cancelDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: "Bağış bulunamadı" });
    }
    // Status'u cancelled yap
    donation.status = "cancelled";
    await donation.save();
    // Bağışçının listelerini güncelle
    await User.findByIdAndUpdate(donation.donor, {
      $pull: { pendingDonations: donationId, completedDonations: donationId },
      $push: { cancelledDonations: donationId },
    });
    // Tüm talep edenlerin listelerini güncelle
    for (const reqObj of donation.requesters) {
      await User.findByIdAndUpdate(reqObj.user, {
        $pull: {
          requestedDonations: donationId,
          receivedDonations: donationId,
        },
        $push: { cancelledRequestedDonations: donationId },
      });
    }
    res.status(200).json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kullanıcının bağışlarını getirme
export const getUserDonations = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate({
        path: "pendingDonations",
        populate: [
          { path: "donor", select: "username profilePicture" },
          { path: "requesters.user", select: "username profilePicture" },
          { path: "selectedRequester", select: "username profilePicture" },
        ],
      })
      .populate({
        path: "completedDonations",
        populate: [
          { path: "donor", select: "username profilePicture" },
          { path: "requesters.user", select: "username profilePicture" },
          { path: "selectedRequester", select: "username profilePicture" },
        ],
      })
      .populate({
        path: "cancelledDonations",
        populate: [
          { path: "donor", select: "username profilePicture" },
          { path: "requesters.user", select: "username profilePicture" },
          { path: "selectedRequester", select: "username profilePicture" },
        ],
      })
      .populate({
        path: "requestedDonations",
        populate: [
          { path: "donor", select: "username profilePicture" },
          { path: "requesters.user", select: "username profilePicture" },
          { path: "selectedRequester", select: "username profilePicture" },
        ],
      })
      .populate({
        path: "receivedDonations",
        populate: [
          { path: "donor", select: "username profilePicture" },
          { path: "requesters.user", select: "username profilePicture" },
          { path: "selectedRequester", select: "username profilePicture" },
        ],
      });
    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı" });
    }
    res.status(200).json({
      pendingDonations: user.pendingDonations,
      completedDonations: user.completedDonations,
      cancelledDonations: user.cancelledDonations,
      requestedDonations: user.requestedDonations,
      receivedDonations: user.receivedDonations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
