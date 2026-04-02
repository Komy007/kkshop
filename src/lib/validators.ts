/**
 * Zod 입력 검증 스키마 — KKShop API 공통 사용
 */
import { z } from 'zod';

// ── 회원가입 ─────────────────────────────────────────────────────────────────
export const RegisterSchema = z.object({
    name:          z.string().min(2, '이름은 2자 이상이어야 합니다').max(100).trim(),
    email:         z.string().email('올바른 이메일 주소를 입력하세요').max(255).toLowerCase(),
    password:      z.string()
                     .min(8, '비밀번호는 8자 이상이어야 합니다')
                     .max(72,  '비밀번호는 72자 이하이어야 합니다')
                     .regex(/[a-zA-Z]/, '영문자를 포함해야 합니다')
                     .regex(/[0-9]/,    '숫자를 포함해야 합니다'),
    phone:         z.string().min(7, '전화번호를 입력하세요').max(50).trim(),
    address:       z.string().min(3, '주소를 입력하세요').max(255).trim(),
    detailAddress: z.string().max(255).trim().optional().nullable(),
    postalCode:    z.string().max(20).trim().optional().nullable(),
    referralCode:  z.string().max(20).trim().toUpperCase().optional().nullable(),
});

// ── 주문 생성 (Checkout) ──────────────────────────────────────────────────────
export const OrderItemSchema = z.object({
    productId: z.string().regex(/^\d+$/, '잘못된 상품 ID'),
    variantId: z.string().regex(/^\d+$/).optional().nullable(),
    optionId:  z.string().regex(/^\d+$/).optional().nullable(),
    quantity:  z.number().int().min(1, '수량은 1 이상이어야 합니다').max(999),
    priceUsd:  z.number().min(0).max(100_000),
});

export const CreateOrderSchema = z.object({
    items:          z.array(OrderItemSchema).min(1, '주문 항목이 없습니다').max(50),
    customerName:   z.string().min(1, '이름을 입력하세요').max(100).trim(),
    customerPhone:  z.string().min(7, '전화번호를 입력하세요').max(50).trim(),
    customerEmail:  z.string().email().max(255).optional().nullable(),
    province:       z.string().max(100).trim().optional().nullable(),
    address:        z.string().min(3, '주소를 입력하세요').max(255).trim(),
    detailAddress:  z.string().max(255).trim().optional().nullable(),
    notes:          z.string().max(500).trim().optional().nullable(),
    couponCode:     z.string().max(50).trim().optional().nullable(),
    pointsUsed:     z.number().int().min(0).default(0),
});

// ── 비밀번호 공통 검증 (모든 엔드포인트에서 사용) ────────────────────────────
export const PasswordSchema = z.string()
    .min(8, '비밀번호는 8자 이상이어야 합니다')
    .max(72, '비밀번호는 72자 이하이어야 합니다')
    .regex(/[a-zA-Z]/, '영문자를 포함해야 합니다')
    .regex(/[0-9]/, '숫자를 포함해야 합니다');

// ── 셀러(공급자) 등록 ───────────────────────────────────────────────────────
export const SupplierRegisterSchema = z.object({
    companyName:     z.string().min(2, '회사명은 2자 이상이어야 합니다').max(100).trim(),
    brandName:       z.string().max(100).trim().optional().nullable(),
    country:         z.string().max(50).trim().optional().nullable(),
    phone:           z.string().min(7, '전화번호를 입력하세요').max(30).trim().optional().nullable(),
    contactEmail:    z.string().email('올바른 이메일 주소를 입력하세요').max(255),
    description:     z.string().max(2000).trim().optional().nullable(),
    ceoName:         z.string().max(100).trim().optional().nullable(),
    businessNumber:  z.string().max(50).trim().optional().nullable(),
    businessAddress: z.string().max(255).trim().optional().nullable(),
});

// ── 반품 요청 (고객) ──────────────────────────────────────────────────────────
export const ReturnRequestSchema = z.object({
    reason: z.string()
               .min(10, '반품 사유를 10자 이상 입력해 주세요')
               .max(500, '반품 사유는 500자 이하로 입력해 주세요')
               .trim(),
});

// ── 쿠폰 검증 ─────────────────────────────────────────────────────────────────
export const ValidateCouponSchema = z.object({
    code:          z.string().min(1).max(50).trim().toUpperCase(),
    orderSubtotal: z.number().min(0),
});

// ── 상품 Q&A 등록 ──────────────────────────────────────────────────────────────
export const ProductQASchema = z.object({
    question:  z.string().min(5, '질문은 5자 이상 입력해 주세요').max(1000).trim(),
    isPrivate: z.boolean().default(false),
});

// ── 리뷰 등록 ─────────────────────────────────────────────────────────────────
export const CreateReviewSchema = z.object({
    rating:  z.number().int().min(1).max(5),
    content: z.string().min(5, '리뷰 내용을 5자 이상 입력해 주세요').max(2000).trim(),
    orderId: z.string().optional().nullable(),
});

// ── 배송지 등록 ──────────────────────────────────────────────────────────────
export const AddressSchema = z.object({
    label:         z.string().min(1).max(50).trim(),
    recipientName: z.string().min(1).max(100).trim(),
    phone:         z.string().min(7).max(50).trim(),
    province:      z.string().min(1).max(100).trim(),
    address:       z.string().min(3).max(255).trim(),
    detailAddress: z.string().max(255).trim().optional().nullable(),
    isDefault:     z.boolean().default(false),
});
