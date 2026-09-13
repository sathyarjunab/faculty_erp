import type bcryptjs from 'bcryptjs';
import ApiError from '../utils/ApiError';
import type { TeacherRepository } from '../repositories/teacher.repository';
import type { AuthService, SanitizedTeacher } from './auth.service';

interface ProfileServiceDeps {
  teacherRepository: TeacherRepository;
  authService: AuthService;
  bcrypt: typeof bcryptjs;
}

interface ProfileUpdate {
  name?: string;
  dept?: string | null;
  photoUrl?: string | null;
}

export const makeProfileService = ({ teacherRepository, authService, bcrypt }: ProfileServiceDeps) => {
  const getProfile = async (teacherId: number): Promise<SanitizedTeacher> => {
    const teacher = await teacherRepository.findByPkWithSecret(teacherId);
    if (!teacher) throw ApiError.notFound('Teacher not found.');
    return authService.sanitizeTeacher(teacher);
  };

  const updateProfile = async (teacherId: number, { name, dept, photoUrl }: ProfileUpdate): Promise<SanitizedTeacher> => {
    const teacher = await teacherRepository.findByPkWithSecret(teacherId);
    if (!teacher) throw ApiError.notFound('Teacher not found.');

    if (name !== undefined) teacher.name = name;
    if (dept !== undefined) teacher.dept = dept;
    if (photoUrl !== undefined) teacher.photoUrl = photoUrl;
    await teacher.save();

    return authService.sanitizeTeacher(teacher);
  };

  const changePassword = async (
    teacherId: number,
    { currentPassword, newPassword }: { currentPassword?: string; newPassword: string }
  ): Promise<SanitizedTeacher> => {
    const teacher = await teacherRepository.findByPkWithSecret(teacherId);
    if (!teacher) throw ApiError.notFound('Teacher not found.');

    if (teacher.passwordHash) {
      const ok = !!currentPassword && (await bcrypt.compare(currentPassword, teacher.passwordHash));
      if (!ok) throw ApiError.badRequest('Current password is incorrect.');
    }

    teacher.passwordHash = await bcrypt.hash(newPassword, 10);
    await teacher.save();
    return authService.sanitizeTeacher(teacher);
  };

  return { getProfile, updateProfile, changePassword };
};

export type ProfileService = ReturnType<typeof makeProfileService>;
