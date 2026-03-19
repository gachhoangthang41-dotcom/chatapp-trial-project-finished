import getAdminUser from "@/app/actions/getAdminUser";
import prisma from "@/app/libs/prismadb";
import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

interface IParams {
  userId: string;
}

const allowedRoles: UserRole[] = ["USER", "ADMIN"];

export async function PATCH(
  request: Request,
  context: { params: Promise<IParams> }
) {
  try {
    const adminUser = await getAdminUser();

    if (!adminUser) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { userId } = await context.params;
    const body = await request.json();
    const role = body?.role as UserRole | undefined;

    if (!role || !allowedRoles.includes(role)) {
      return new NextResponse("Invalid role", { status: 400 });
    }

    if (userId === adminUser.id) {
      return new NextResponse("You cannot change your own admin role", {
        status: 400,
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("ADMIN_UPDATE_ROLE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
