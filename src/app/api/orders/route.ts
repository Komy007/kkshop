import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customerName, customerPhone, customerEmail, address, detailAddress, items, totalUsd } = body;

        // Basic validation
        if (!customerName || !customerPhone || !address || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Inside a transaction, create the order and the order items
        const newOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    customerName,
                    customerPhone,
                    customerEmail,
                    address,
                    detailAddress,
                    totalUsd,
                    status: 'PENDING',
                }
            });

            // Create Order items mapping the frontend cart structure
            const orderItemsData = items.map((item: any) => ({
                orderId: order.id,
                productId: BigInt(item.productId),
                quantity: item.qty,
                priceUsd: item.priceUsd,
            }));

            await tx.orderItem.createMany({
                data: orderItemsData
            });

            return order;
        });

        return NextResponse.json({ success: true, orderId: newOrder.id }, { status: 201 });

    } catch (error) {
        console.error('Checkout API error:', error);
        return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
    }
}
