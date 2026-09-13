import { makeAuthController } from './auth.controller';
import { makeProfileController } from './profile.controller';
import { makeClassroomController } from './classroom.controller';
import { makeMarksController } from './marks.controller';
import { makeDashboardController } from './dashboard.controller';
import type { Services } from '../services';
import type { AppConfig } from '../config/env';

/** Controller registry factory. Wires controllers to services. */
export const makeControllers = ({ services, config }: { services: Services; config: AppConfig }) => ({
  auth: makeAuthController({
    authService: services.authService,
    profileService: services.profileService,
    config,
  }),
  profile: makeProfileController({ profileService: services.profileService }),
  classroom: makeClassroomController({ classroomService: services.classroomService }),
  marks: makeMarksController({
    marksService: services.marksService,
    exportService: services.exportService,
  }),
  dashboard: makeDashboardController({ dashboardService: services.dashboardService }),
});

export type Controllers = ReturnType<typeof makeControllers>;
