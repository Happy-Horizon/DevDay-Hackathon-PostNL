export interface MagentoSession {
  phpsessid: string;
  formKey: string;
}

export interface SimpleProduct {
  sku: string;
  name: string;
  price: number;
  currency: string;
  id?: string;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  currency: string;
  braintreeMaskedId?: string;
}

export interface CheckoutResult {
  orderId: string;
  checkoutUrl: string;
  cartId?: string;
}

export interface DeliveryEstimate {
  deliveryDate: string;
  deliveryWindow: string;
  serviceType: string;
}
