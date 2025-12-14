
export const mapProduct = (p) => ({
  id: p.uuid,
  name: p.title,
  description: p.description || null,
  price: p.sell_price,
  rent_price: p.rent_price ?? null,
  brand: p.category?.name ?? "Umum",
  icon: p.image ?? null,
  stock: p.stock ?? 0,
});

export const mapCategory = (c) => c.name;

export const mapCustomer = (c) => ({
  id: c.uuid,
  uuid: c.uuid,
  name: c.label ?? c.name_perusahaan ?? "",
  phone: c.no_telp ?? c.phone ?? null,
  address: c.address ?? null,
  originalId: c.value ?? c.id ?? null,
});

export const mapCart = (c) => ({
  id: c.id,
  qty: c.qty,
  product_id: c.product?.uuid ?? c.product_id, 
  name: c.product?.title ?? c.name ?? "",
  price: c.product?.sell_price ?? c.price ?? 0,
  icon: c.product?.image ?? c.icon ?? null,
  start_date: c.start_date ?? null,
  end_date: c.end_date ?? null,
});
