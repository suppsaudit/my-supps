-- NOW Foods商品を直接挿入（バーコード19121619を含む）
INSERT INTO supplements (dsld_id, name_en, name_ja, brand, serving_size, category) VALUES
('DSLD_19121619', 'NOW Foods Vitamin C-1000 Sustained Release 100 Tablets', 'NOW Foods ビタミンC-1000 徐放性 100錠', 'NOW Foods', '1 tablet', 'vitamins'),
('DSLD_033674155103', 'NOW Foods Magnesium Citrate 200mg 250 Tablets', 'NOW Foods マグネシウムクエン酸 200mg 250錠', 'NOW Foods', '1 tablet', 'minerals'),
('DSLD_733739012623', 'NOW Foods Omega-3 1000mg 200 Softgels', 'NOW Foods オメガ3 1000mg 200ソフトジェル', 'NOW Foods', '1 softgel', 'fatty_acids'),
('DSLD_733739004567', 'NOW Foods Zinc Picolinate 50mg 120 Capsules', 'NOW Foods 亜鉛ピコリネート 50mg 120カプセル', 'NOW Foods', '1 capsule', 'minerals'),
('DSLD_733739012456', 'NOW Foods Vitamin D3 5000 IU 240 Softgels', 'NOW Foods ビタミンD3 5000 IU 240ソフトジェル', 'NOW Foods', '1 softgel', 'vitamins');

-- 確認
SELECT * FROM supplements WHERE brand = 'NOW Foods';