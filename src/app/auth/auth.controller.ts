
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
    constructor() { }

    @Get('me')
    @UseGuards(AuthGuard('supabase-jwt'))
    async getMe(@Req() req: any) {
        return {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            organizationId: req.user.organizationId
        };
    }
}
