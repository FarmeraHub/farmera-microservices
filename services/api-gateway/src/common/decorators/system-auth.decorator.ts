import { SetMetadata } from '@nestjs/common';

export const IS_SYSTEM_AUTH_KEY = 'isSystem';
export const SystemAuth = () => SetMetadata(IS_SYSTEM_AUTH_KEY, true); 