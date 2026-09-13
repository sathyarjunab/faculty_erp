import asyncHandler from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import type { ProfileService } from '../services/profile.service';

export const makeProfileController = ({ profileService }: { profileService: ProfileService }) => {
  const getProfile = asyncHandler(async (req, res) => {
    const teacher = await profileService.getProfile(req.user!.id);
    sendSuccess(res, { message: 'OK', data: { teacher } });
  });

  const updateProfile = asyncHandler(async (req, res) => {
    const teacher = await profileService.updateProfile(req.user!.id, req.body);
    sendSuccess(res, { message: 'Profile updated.', data: { teacher } });
  });

  const changePassword = asyncHandler(async (req, res) => {
    const teacher = await profileService.changePassword(req.user!.id, req.body);
    sendSuccess(res, { message: 'Password updated.', data: { teacher } });
  });

  return { getProfile, updateProfile, changePassword };
};

export type ProfileController = ReturnType<typeof makeProfileController>;
