/**
 * PaymentGateway Interface
 *
 * Abstract interface for payment processing.
 * Currently uses MockPaymentGateway.
 * TODO: Replace with actual payment API (ABA PayWay, etc.) in Phase 7.
 */

export interface PaymentResult {
    success: boolean;
    orderId: string;
    transactionId?: string;
    message: string;
    estimatedDelivery?: string;
}

export interface PaymentRequest {
    amount: number;
    currency: string;
    method: string; // 'aba_payway' | 'khqr' | 'credit_card' | 'bank_transfer'
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
    items: Array<{
        productId: string;
        name: string;
        qty: number;
        priceUsd: number;
    }>;
}

export interface PaymentGateway {
    processPayment(request: PaymentRequest): Promise<PaymentResult>;
    getName(): string;
}

/**
 * Mock Payment Gateway — used during development
 * TODO: Replace with actual payment API in Phase 7
 */
export class MockPaymentGateway implements PaymentGateway {
    getName(): string {
        return 'MockPaymentGateway';
    }

    async processPayment(request: PaymentRequest): Promise<PaymentResult> {
        // TODO: Replace with actual payment API
        console.log('Payment API will be integrated here', request);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Generate mock order ID
        const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // Calculate estimated delivery (3-5 business days from now)
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + Math.floor(Math.random() * 3) + 3);

        return {
            success: true,
            orderId,
            transactionId: `TXN-${Date.now()}`,
            message: 'Payment processed successfully (Mock)',
            estimatedDelivery: deliveryDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
        };
    }
}

// Singleton instance — swap this when integrating real payment
export const paymentGateway: PaymentGateway = new MockPaymentGateway();
