import { createParamDecorator, ExecutionContext } from '@nestjs/common';
function escapeRegex(string?: string) {
  if (!string) return '';
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
export const EscapedQuery = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return escapeRegex(request.query[data as string]);
  },
);
