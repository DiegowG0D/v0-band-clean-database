import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/permissions';

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json();
    
    const user = await requireRole(role);
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unauthorized' 
      },
      { status: 403 }
    );
  }
}
