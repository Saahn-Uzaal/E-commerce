USE ecommerce_store;

INSERT INTO categories (name, slug, description)
VALUES
  ('Thiết yếu mỗi ngày', 'essentials', 'Những sản phẩm nhỏ, dễ chốt đơn nhanh và có khả năng mua lại cao.'),
  ('Nâng cấp góc làm việc', 'workspace', 'Các món cho góc làm việc tại nhà giúp trình bày ảnh, nội dung và combo tốt hơn.'),
  ('Đồ dùng du lịch', 'travel', 'Các sản phẩm tầm giá trung bình phù hợp cho khối nổi bật và chiến dịch khuyến mãi.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO products (
  category_id,
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
  (
    (SELECT id FROM categories WHERE slug = 'travel'),
    'Túi xách vải lanh',
    'linen-carryall',
    'GET-001',
    'Bán chạy',
    'Túi mềm phom đứng cho những chuyến đi cuối tuần, việc vặt và mang theo hằng ngày.',
    'linear-gradient(135deg, #14323e, #4d7787)',
    NULL,
    'Quai phủ sáp',
    'Miễn phí vận chuyển nội thành',
    'Ngăn máy tính 13 inch',
    780000.00,
    18,
    1,
    'active'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'essentials'),
    'Bộ ly gốm nung',
    'stoneware-mug-set',
    'GET-002',
    'Combo',
    'Hai ly tông trung tính cho buổi sáng, quà tặng và góc bếp.',
    'linear-gradient(135deg, #8d3615, #d9906f)',
    NULL,
    'Men hoàn thiện thủ công',
    'Giao tiêu chuẩn toàn quốc',
    'An toàn với máy rửa chén',
    340000.00,
    42,
    1,
    'active'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'workspace'),
    'Tấm lót bàn nỉ',
    'felt-desk-mat',
    'GET-003',
    'Mới về',
    'Điểm nhấn gọn gàng cho bàn phím, sổ tay và ảnh chụp ngày mở bán.',
    'linear-gradient(135deg, #3b4c28, #94a36c)',
    NULL,
    'Bề mặt pha len merino',
    'Gói chống nước nhẹ',
    'Cuộn gọn dễ mang',
    460000.00,
    27,
    1,
    'active'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'essentials'),
    'Bộ hũ thủy tinh 3 món',
    'glass-storage-trio',
    'GET-004',
    'Gian bếp',
    'Hộp đựng nhà bếp lên hình đẹp và bán tốt theo combo.',
    'linear-gradient(135deg, #614134, #c08b72)',
    NULL,
    'Nắp kín hơi',
    'Miễn phí vận chuyển cho đơn từ 499.000đ',
    'Kích thước lồng nhau',
    520000.00,
    31,
    1,
    'active'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'workspace'),
    'Túi chống sốc vải bố cho máy tính xách tay',
    'canvas-laptop-sleeve',
    'GET-005',
    'Chọn lọc',
    'Bao đựng có đệm cho trang sản phẩm tối giản và bán kèm hiệu quả.',
    'linear-gradient(135deg, #362d4a, #8d78be)',
    NULL,
    'Nắp nam châm',
    'Giao nhanh trong ngày tại nội thành',
    'Lót nhung mềm',
    640000.00,
    14,
    0,
    'active'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'travel'),
    'Bộ túi chia đồ cuối tuần',
    'weekend-packing-cubes',
    'GET-006',
    'Tiện ích',
    'Túi nén giúp tăng doanh thu bán kèm và khách dễ hiểu công năng.',
    'linear-gradient(135deg, #264653, #52b6ab)',
    NULL,
    'Bộ 3 món',
    'Miễn phí vận chuyển ngoại thành cho đơn từ 699.000đ',
    'Mặt lưới thoáng',
    390000.00,
    55,
    0,
    'active'
  )
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
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

INSERT INTO product_highlights (product_id, content, sort_order)
VALUES
  ((SELECT id FROM products WHERE slug = 'linen-carryall'), 'Quai phủ sáp', 1),
  ((SELECT id FROM products WHERE slug = 'linen-carryall'), 'Ngăn máy tính 13 inch', 2),
  ((SELECT id FROM products WHERE slug = 'linen-carryall'), 'Lớp lót chống thấm nhẹ', 3),
  ((SELECT id FROM products WHERE slug = 'stoneware-mug-set'), 'Men hoàn thiện thủ công', 1),
  ((SELECT id FROM products WHERE slug = 'stoneware-mug-set'), 'Xếp chồng gọn', 2),
  ((SELECT id FROM products WHERE slug = 'stoneware-mug-set'), 'An toàn với máy rửa chén', 3),
  ((SELECT id FROM products WHERE slug = 'felt-desk-mat'), 'Bề mặt pha len merino', 1),
  ((SELECT id FROM products WHERE slug = 'felt-desk-mat'), 'Rãnh luồn cáp', 2),
  ((SELECT id FROM products WHERE slug = 'felt-desk-mat'), 'Cuộn gọn dễ mang', 3),
  ((SELECT id FROM products WHERE slug = 'glass-storage-trio'), 'Nắp kín hơi', 1),
  ((SELECT id FROM products WHERE slug = 'glass-storage-trio'), 'Kích thước lồng nhau', 2),
  ((SELECT id FROM products WHERE slug = 'glass-storage-trio'), 'Bao bì sẵn kệ', 3),
  ((SELECT id FROM products WHERE slug = 'canvas-laptop-sleeve'), 'Nắp nam châm', 1),
  ((SELECT id FROM products WHERE slug = 'canvas-laptop-sleeve'), 'Lót nhung mềm', 2),
  ((SELECT id FROM products WHERE slug = 'canvas-laptop-sleeve'), 'Vừa thiết bị 14 inch', 3),
  ((SELECT id FROM products WHERE slug = 'weekend-packing-cubes'), 'Bộ 3 món', 1),
  ((SELECT id FROM products WHERE slug = 'weekend-packing-cubes'), 'Mặt lưới thoáng', 2),
  ((SELECT id FROM products WHERE slug = 'weekend-packing-cubes'), 'Giặt máy được', 3)
ON DUPLICATE KEY UPDATE
  content = VALUES(content);
