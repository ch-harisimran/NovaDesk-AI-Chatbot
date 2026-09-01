export interface SeedOrder {
  order_number: string;
  customer_email: string;
  status: "processing" | "shipped" | "out_for_delivery" | "delivered" | "delayed" | "cancelled" | "returned";
  items: string;
  total_cents: number;
  tracking_number: string | null;
  estimated_delivery_days_from_now: number | null; // relative offset used to compute a date at seed time
}

export const seedOrders: SeedOrder[] = [
  {
    order_number: "SLC-10234",
    customer_email: "jenna.marlowe@gmail.com",
    status: "delivered",
    items: "Dew Drop Vitamin C Serum (30ml), Barrier Repair Moisturizer (50ml)",
    total_cents: 10400,
    tracking_number: "1Z999AA10123456784",
    estimated_delivery_days_from_now: -3,
  },
  {
    order_number: "SLC-10235",
    customer_email: "priya.chandran@outlook.com",
    status: "shipped",
    items: "Gentle Clay Cleanser (120ml)",
    total_cents: 2800,
    tracking_number: "1Z999AA10123456912",
    estimated_delivery_days_from_now: 2,
  },
  {
    order_number: "SLC-10236",
    customer_email: "marcus.webb@yahoo.com",
    status: "out_for_delivery",
    items: "Dew Drop Vitamin C Serum (30ml)",
    total_cents: 5800,
    tracking_number: "1Z999AA10123457003",
    estimated_delivery_days_from_now: 0,
  },
  {
    order_number: "SLC-10237",
    customer_email: "ashley.tran99@gmail.com",
    status: "delayed",
    items: "Barrier Repair Moisturizer (50ml), Gentle Clay Cleanser (120ml), Dew Drop Vitamin C Serum (15ml)",
    total_cents: 10600,
    tracking_number: "1Z999AA10123457118",
    estimated_delivery_days_from_now: 4,
  },
  {
    order_number: "SLC-10238",
    customer_email: "davidokafor@proton.me",
    status: "processing",
    items: "Barrier Repair Moisturizer (50ml)",
    total_cents: 4600,
    tracking_number: null,
    estimated_delivery_days_from_now: 6,
  },
  {
    order_number: "SLC-10239",
    customer_email: "linda.hsu@icloud.com",
    status: "delivered",
    items: "Dew Drop Vitamin C Serum (30ml), Silk Peptide Serum (30ml)",
    total_cents: 12600,
    tracking_number: "1Z999AA10123457299",
    estimated_delivery_days_from_now: -8,
  },
  {
    order_number: "SLC-10240",
    customer_email: "tomastheron@gmail.com",
    status: "returned",
    items: "Gentle Clay Cleanser (120ml)",
    total_cents: 2800,
    tracking_number: "1Z999AA10123457356",
    estimated_delivery_days_from_now: -14,
  },
  {
    order_number: "SLC-10241",
    customer_email: "nicole.b.andrews@gmail.com",
    status: "cancelled",
    items: "Honey Enzyme Mask (75ml)",
    total_cents: 3800,
    tracking_number: null,
    estimated_delivery_days_from_now: null,
  },
  {
    order_number: "SLC-10242",
    customer_email: "rachel.osei@gmail.com",
    status: "shipped",
    items: "Barrier Repair Moisturizer (50ml), Dew Drop Vitamin C Serum (30ml)",
    total_cents: 10400,
    tracking_number: "1Z999AA10123457481",
    estimated_delivery_days_from_now: 3,
  },
  {
    order_number: "SLC-10243",
    customer_email: "kevin.delatorre@hotmail.com",
    status: "delivered",
    items: "Gentle Clay Cleanser (120ml), Barrier Repair Moisturizer (50ml)",
    total_cents: 7400,
    tracking_number: "1Z999AA10123457590",
    estimated_delivery_days_from_now: -5,
  },
];
