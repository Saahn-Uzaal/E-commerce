USE ecommerce_store;

UPDATE user_accounts
SET
  email = 'buyer@gmail.com',
  password_hash = 'scrypt:buyer-salt-gettsay:6d0297712f017298232067df4179ca6ff7ff99522b0f34058b65f9d26b8ed4a295d420023d7965fc8d11356306aadfa41c67db06896165e660bca91dbca1f568',
  full_name = 'Khach Mua Gettsay',
  phone = '0900000001',
  status = 'active'
WHERE role = 'buyer';

INSERT INTO user_accounts (email, password_hash, full_name, phone, role, status)
SELECT
  'buyer@gmail.com',
  'scrypt:buyer-salt-gettsay:6d0297712f017298232067df4179ca6ff7ff99522b0f34058b65f9d26b8ed4a295d420023d7965fc8d11356306aadfa41c67db06896165e660bca91dbca1f568',
  'Khach Mua Gettsay',
  '0900000001',
  'buyer',
  'active'
WHERE NOT EXISTS (
  SELECT 1
  FROM user_accounts
  WHERE role = 'buyer'
);

UPDATE user_accounts
SET
  email = 'seller@gmail.com',
  password_hash = 'scrypt:seller-salt-gettsay:ed54ac594b2ca34440dfcbe5fac5053a835c01045f1b9d462ba6ebb353dd0a640d5f3250f71c731c4f9bedf8d81015809379e67826b5604bc87b117a166105d1',
  full_name = 'Nha Ban Hang Gettsay',
  phone = '0900000002',
  status = 'active'
WHERE role = 'seller';

INSERT INTO user_accounts (email, password_hash, full_name, phone, role, status)
SELECT
  'seller@gmail.com',
  'scrypt:seller-salt-gettsay:ed54ac594b2ca34440dfcbe5fac5053a835c01045f1b9d462ba6ebb353dd0a640d5f3250f71c731c4f9bedf8d81015809379e67826b5604bc87b117a166105d1',
  'Nha Ban Hang Gettsay',
  '0900000002',
  'seller',
  'active'
WHERE NOT EXISTS (
  SELECT 1
  FROM user_accounts
  WHERE role = 'seller'
);

INSERT INTO user_accounts (email, password_hash, full_name, phone, role, status)
VALUES
  (
    'admin@gettsay.local',
    'scrypt:admin-salt-gettsay:d0997a8beb8fdd7dafaf1646df3fec990faea1359ae494a039892e06a3b766feefebfaa9490572a7dc4969145e6781a0bb195c2e46a240d08220ba70f5a481bd',
    'Quan Tri Gettsay',
    '0900000003',
    'admin',
    'active'
  )
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  phone = VALUES(phone),
  role = VALUES(role),
  status = VALUES(status);

SET @seller_account_id = (
  SELECT id
  FROM user_accounts
  WHERE role = 'seller'
  ORDER BY id ASC
  LIMIT 1
);

UPDATE products
SET seller_account_id = @seller_account_id;

INSERT INTO categories (name, slug, description)
VALUES
  ('Nhà cửa và đời sống', 'home-living', 'Đồ dùng nhà cửa, sắp xếp không gian và sản phẩm decor tiện dụng.'),
  ('Phụ kiện công nghệ', 'tech-accessories', 'Phụ kiện số cho công việc, học tập và di chuyển hằng ngày.'),
  ('Thời trang ứng dụng', 'fashion', 'Trang phục và phụ kiện dễ phối cho nhịp sống hằng ngày.'),
  ('Mẹ và bé', 'kids', 'Những món thiết yếu giúp chăm sóc bé và tiện lợi cho gia đình.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO products (
  category_id,
  seller_account_id,
  name,
  slug,
  sku,
  badge,
  description,
  gradient,
  primary_image_url,
  material_note,
  shipping_note,
  fit_note,
  price,
  inventory_qty,
  is_featured,
  status
)
VALUES
  ((SELECT id FROM categories WHERE slug = 'workspace'), @seller_account_id, 'Giá kê laptop nhôm', 'aluminum-laptop-stand', 'GET-007', 'Bán tốt', 'Giá kê nhôm gấp gọn giúp nâng tầm mắt và tối ưu góc làm việc nhỏ.', 'linear-gradient(135deg, #43556f, #7f95b0)', NULL, 'Khung nhôm anodized', 'Giao nhanh trong ngày nội thành', 'Gập phẳng sau khi dùng', 420000.00, 36, 1, 'active'),
  ((SELECT id FROM categories WHERE slug = 'essentials'), @seller_account_id, 'Bộ bút highlight pastel', 'pastel-highlighter-set', 'GET-008', 'Văn phòng', 'Bộ bút tông pastel cho ghi chú đẹp mắt và học tập hiệu quả hơn.', 'linear-gradient(135deg, #f7d3dc, #fbece3)', NULL, 'Đầu bút chống lem', 'Miễn phí vận chuyển cho đơn từ 299.000đ', '6 màu dễ phối trang vở', 129000.00, 80, 0, 'active'),
  ((SELECT id FROM categories WHERE slug = 'travel'), @seller_account_id, 'Bình giữ nhiệt thép 500ml', 'steel-bottle-500ml', 'GET-009', 'Mới về', 'Bình thép nhỏ gọn giữ nhiệt tốt cho đi làm, đi học và di chuyển ngắn.', 'linear-gradient(135deg, #1e293b, #64748b)', NULL, 'Thép không gỉ 304', 'Giao tiêu chuẩn toàn quốc', 'Vừa hầu hết ngăn bình trên balo', 285000.00, 62, 1, 'active'),
  ((SELECT id FROM categories WHERE slug = 'travel'), @seller_account_id, 'Balo chống nước commuter', 'waterproof-commuter-backpack', 'GET-010', 'Đề cử', 'Balo dung tích vừa đủ cho laptop, tài liệu và các vật dụng đi làm hằng ngày.', 'linear-gradient(135deg, #172554, #2563eb)', NULL, 'Vải phủ chống nước', 'Miễn phí vận chuyển toàn quốc', 'Ngăn laptop chống sốc 15 inch', 890000.00, 24, 1, 'active'),
  ((SELECT id FROM categories WHERE slug = 'home-living'), @seller_account_id, 'Bộ ga gối cotton mềm', 'cotton-bedding-set', 'GET-011', 'Gia đình', 'Bộ ga gối chất cotton mềm, màu trung tính dễ phối với không gian ngủ tối giản.', 'linear-gradient(135deg, #c7b8a3, #efe6d8)', NULL, 'Cotton chải mềm', 'Giao hàng tiêu chuẩn 2-4 ngày', 'Phù hợp nệm 1m6', 1150000.00, 18, 1, 'active'),
  ((SELECT id FROM categories WHERE slug = 'home-living'), @seller_account_id, 'Khay đựng mỹ phẩm acrylic', 'acrylic-cosmetic-organizer', 'GET-012', 'Tiện ích', 'Khay trong suốt nhiều ngăn giúp bàn trang điểm gọn gàng và dễ nhìn.', 'linear-gradient(135deg, #dfe8f5, #ffffff)', NULL, 'Acrylic dày trong suốt', 'Miễn phí vận chuyển cho đơn từ 399.000đ', '4 ngăn lớn và 6 ngăn nhỏ', 315000.00, 41, 0, 'active'),
  ((SELECT id FROM categories WHERE slug = 'tech-accessories'), @seller_account_id, 'Tai nghe bluetooth mini', 'mini-bluetooth-earbuds', 'GET-013', 'Công nghệ', 'Tai nghe nhỏ gọn, độ trễ thấp và phù hợp cho nhu cầu nghe gọi hằng ngày.', 'linear-gradient(135deg, #111827, #4b5563)', NULL, 'Bluetooth 5.3', 'Giao nhanh 24h tại nội thành', 'Hộp sạc bỏ túi tiện lợi', 690000.00, 53, 1, 'active'),
  ((SELECT id FROM categories WHERE slug = 'tech-accessories'), @seller_account_id, 'Cáp sạc bọc dù 100W', 'braided-cable-100w', 'GET-014', 'Phụ kiện', 'Cáp sạc nhanh bọc dù bền, hỗ trợ laptop, tablet và điện thoại.', 'linear-gradient(135deg, #0f172a, #0ea5e9)', NULL, 'Lõi đồng dày', 'Miễn phí vận chuyển cho đơn phụ kiện từ 199.000đ', 'Dài 1.5m, đầu USB-C to USB-C', 179000.00, 120, 0, 'active'),
  ((SELECT id FROM categories WHERE slug = 'tech-accessories'), @seller_account_id, 'Chuột không dây silent', 'silent-wireless-mouse', 'GET-015', 'Bán chạy', 'Chuột không dây click êm, cầm vừa tay cho học tập và làm việc văn phòng.', 'linear-gradient(135deg, #334155, #94a3b8)', NULL, 'Cảm biến quang ổn định', 'Giao tiêu chuẩn toàn quốc', 'Click yên tĩnh, pin AA dễ thay', 265000.00, 72, 1, 'active'),
  ((SELECT id FROM categories WHERE slug = 'fashion'), @seller_account_id, 'Áo hoodie nỉ basic', 'basic-fleece-hoodie', 'GET-016', 'Thời trang', 'Áo hoodie phom vừa, chất nỉ mềm dễ mặc trong nhiều tình huống hằng ngày.', 'linear-gradient(135deg, #6b4f4f, #b08968)', NULL, 'Nỉ cotton pha', 'Đổi size trong 7 ngày', 'Phom regular fit dễ phối', 520000.00, 29, 0, 'active'),
  ((SELECT id FROM categories WHERE slug = 'fashion'), @seller_account_id, 'Túi đeo chéo mini', 'mini-crossbody-bag', 'GET-017', 'Hot', 'Túi đeo chéo gọn nhẹ cho điện thoại, ví nhỏ và đồ cá nhân thiết yếu.', 'linear-gradient(135deg, #3f3cbb, #6c63ff)', NULL, 'Da tổng hợp mềm', 'Giao hỏa tốc nội thành', 'Dây đeo chỉnh độ dài', 390000.00, 47, 1, 'active'),
  ((SELECT id FROM categories WHERE slug = 'home-living'), @seller_account_id, 'Bộ hộp cơm thủy tinh', 'glass-lunch-box-set', 'GET-018', 'Gia dụng', 'Bộ hộp cơm thủy tinh kín mùi, phù hợp mang đi làm hoặc bảo quản thực phẩm.', 'linear-gradient(135deg, #8ec5fc, #e0c3fc)', NULL, 'Thủy tinh borosilicate', 'Miễn phí vận chuyển cho đơn gia dụng từ 499.000đ', 'Dùng được trong lò vi sóng', 460000.00, 34, 0, 'active'),
  ((SELECT id FROM categories WHERE slug = 'workspace'), @seller_account_id, 'Đèn bàn gấp gọn LED', 'folding-led-desk-lamp', 'GET-019', 'Tiện bàn học', 'Đèn LED gấp gọn ba mức sáng cho bàn học và bàn làm việc nhỏ.', 'linear-gradient(135deg, #f3f4f6, #cbd5e1)', NULL, 'Ánh sáng dịu mắt', 'Giao tiêu chuẩn toàn quốc', 'Sạc USB-C tiện dùng', 355000.00, 39, 1, 'active'),
  ((SELECT id FROM categories WHERE slug = 'kids'), @seller_account_id, 'Xe đẩy mini cho bé', 'mini-baby-stroller', 'GET-020', 'Mẹ và bé', 'Xe đẩy mini gấp nhanh, phù hợp cho các chuyến đi ngắn trong thành phố.', 'linear-gradient(135deg, #f9a8d4, #fbcfe8)', NULL, 'Khung thép nhẹ', 'Miễn phí vận chuyển ngoại thành', 'Gập gọn bằng một tay', 1650000.00, 12, 1, 'active'),
  ((SELECT id FROM categories WHERE slug = 'kids'), @seller_account_id, 'Túi giữ nhiệt bình sữa', 'baby-bottle-cooler-bag', 'GET-021', 'Thiết yếu', 'Túi giữ nhiệt nhỏ gọn cho bình sữa và đồ ăn nhẹ của bé khi ra ngoài.', 'linear-gradient(135deg, #bae6fd, #cffafe)', NULL, 'Lớp giữ nhiệt 3 lớp', 'Giao nhanh trong ngày nội thành', 'Đeo vai hoặc treo xe đẩy', 245000.00, 51, 0, 'active'),
  ((SELECT id FROM categories WHERE slug = 'fashion'), @seller_account_id, 'Áo thun cotton boxy', 'boxy-cotton-tee', 'GET-022', 'Mặc hằng ngày', 'Áo thun form boxy dễ phối, chất cotton dày vừa và đứng form tốt.', 'linear-gradient(135deg, #f1f5f9, #cbd5e1)', NULL, 'Cotton 2 chiều', 'Đổi trả trong 7 ngày', 'Phom boxy unisex', 260000.00, 65, 0, 'active'),
  ((SELECT id FROM categories WHERE slug = 'home-living'), @seller_account_id, 'Kệ bếp gấp gọn hai tầng', 'folding-kitchen-rack', 'GET-023', 'Nhà bếp', 'Kệ bếp hai tầng tối ưu không gian đặt chén đĩa, gia vị và đồ dùng hằng ngày.', 'linear-gradient(135deg, #d6ccc2, #f5ebe0)', NULL, 'Khung thép sơn tĩnh điện', 'Giao tiêu chuẩn 2-4 ngày', 'Lắp ráp nhanh dưới 10 phút', 610000.00, 22, 0, 'active'),
  ((SELECT id FROM categories WHERE slug = 'tech-accessories'), @seller_account_id, 'Bàn phím cơ 84 phím', 'mechanical-keyboard-84', 'GET-024', 'Làm việc', 'Bàn phím cơ layout gọn 84 phím, phù hợp góc làm việc tối giản.', 'linear-gradient(135deg, #1f2937, #6b7280)', NULL, 'Switch tactile êm tay', 'Giao nhanh 24h tại nội thành', 'Kết nối dây USB-C ổn định', 1290000.00, 17, 1, 'active')
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  seller_account_id = VALUES(seller_account_id),
  name = VALUES(name),
  badge = VALUES(badge),
  description = VALUES(description),
  gradient = VALUES(gradient),
  primary_image_url = VALUES(primary_image_url),
  material_note = VALUES(material_note),
  shipping_note = VALUES(shipping_note),
  fit_note = VALUES(fit_note),
  price = VALUES(price),
  inventory_qty = VALUES(inventory_qty),
  is_featured = VALUES(is_featured),
  status = VALUES(status);
