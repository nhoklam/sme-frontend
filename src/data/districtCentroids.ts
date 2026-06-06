export const districtCentroids: Record<string, { lat: number; lng: number }> = {
  // --- TP. HỒ CHÍ MINH ---
  "760": { lat: 10.7769, lng: 106.7009 }, // Quận 1
  "761": { lat: 10.8671, lng: 106.6413 }, // Quận 12
  "764": { lat: 10.8386, lng: 106.6659 }, // Quận Gò Vấp
  "765": { lat: 10.8105, lng: 106.7091 }, // Quận Bình Thạnh
  "766": { lat: 10.8014, lng: 106.6525 }, // Quận Tân Bình
  "767": { lat: 10.7904, lng: 106.6264 }, // Quận Tân Phú
  "768": { lat: 10.7994, lng: 106.6775 }, // Quận Phú Nhuận
  "769": { lat: 10.8494, lng: 106.7537 }, // TP Thủ Đức
  "770": { lat: 10.7843, lng: 106.6817 }, // Quận 3
  "771": { lat: 10.7743, lng: 106.6669 }, // Quận 10
  "772": { lat: 10.7630, lng: 106.6443 }, // Quận 11
  "773": { lat: 10.7588, lng: 106.7018 }, // Quận 4
  "774": { lat: 10.7540, lng: 106.6633 }, // Quận 5
  "775": { lat: 10.7480, lng: 106.6353 }, // Quận 6
  "776": { lat: 10.7248, lng: 106.6247 }, // Quận 8
  "777": { lat: 10.7652, lng: 106.6038 }, // Quận Bình Tân
  "778": { lat: 10.7330, lng: 106.7270 }, // Quận 7
  "783": { lat: 11.0066, lng: 106.5055 }, // Huyện Củ Chi
  "784": { lat: 10.8841, lng: 106.5925 }, // Huyện Hóc Môn
  "785": { lat: 10.6874, lng: 106.5939 }, // Huyện Bình Chánh
  "786": { lat: 10.6083, lng: 106.7324 }, // Huyện Nhà Bè
  "787": { lat: 10.4072, lng: 106.8831 }, // Huyện Cần Giờ

  // --- HÀ NỘI ---
  "001": { lat: 21.0341, lng: 105.8155 }, // Quận Ba Đình
  "002": { lat: 21.0285, lng: 105.8542 }, // Quận Hoàn Kiếm
  "003": { lat: 21.0601, lng: 105.8262 }, // Quận Tây Hồ
  "004": { lat: 21.0384, lng: 105.9038 }, // Quận Long Biên
  "005": { lat: 21.0305, lng: 105.7946 }, // Quận Cầu Giấy
  "006": { lat: 21.0128, lng: 105.8277 }, // Quận Đống Đa
  "007": { lat: 21.0065, lng: 105.8431 }, // Quận Hai Bà Trưng
  "008": { lat: 20.9723, lng: 105.8488 }, // Quận Hoàng Mai
  "009": { lat: 20.9936, lng: 105.8143 }, // Quận Thanh Xuân
  "016": { lat: 21.0811, lng: 105.9048 }, // Huyện Gia Lâm
  "017": { lat: 21.1352, lng: 105.8475 }, // Huyện Đông Anh
  "018": { lat: 21.2721, lng: 105.8340 }, // Huyện Sóc Sơn

  // --- ĐÀ NẴNG ---
  "490": { lat: 16.0825, lng: 108.1396 }, // Quận Liên Chiểu
  "491": { lat: 16.0641, lng: 108.1884 }, // Quận Thanh Khê
  "492": { lat: 16.0462, lng: 108.2195 }, // Quận Hải Châu
  "493": { lat: 16.0694, lng: 108.2393 }, // Quận Sơn Trà
  "494": { lat: 16.0125, lng: 108.2435 }, // Quận Ngũ Hành Sơn
  "495": { lat: 16.0135, lng: 108.1873 }, // Quận Cẩm Lệ
  "497": { lat: 16.0543, lng: 108.0195 }, // Huyện Hòa Vang

  // --- CẦN THƠ ---
  "916": { lat: 10.0289, lng: 105.7686 }, // Quận Ninh Kiều
  "917": { lat: 10.0631, lng: 105.6983 }, // Quận Ô Môn
  "918": { lat: 10.0402, lng: 105.7483 }, // Quận Bình Thuỷ
  "919": { lat: 9.9404, lng: 105.7629 }, // Quận Cái Răng
  "923": { lat: 10.1558, lng: 105.6267 }, // Quận Thốt Nốt

  // Fallbacks: Chỉ cần 1 Q/H đại diện cho các tỉnh khác
  "256": { lat: 21.1860, lng: 106.0763 }, // Bắc Ninh (TP Bắc Ninh)
  "288": { lat: 20.9373, lng: 106.3146 }, // Hải Dương (TP Hải Dương)
  "303": { lat: 20.8522, lng: 106.6830 }, // Hải Phòng (Quận Hồng Bàng)
  "380": { lat: 19.8066, lng: 105.7766 }, // Thanh Hóa (TP Thanh Hóa)
  "412": { lat: 18.6795, lng: 105.6813 }, // Nghệ An (TP Vinh)
  "568": { lat: 12.2464, lng: 109.1945 }, // Khánh Hòa (TP Nha Trang)
  "672": { lat: 11.9404, lng: 108.4583 }, // Lâm Đồng (TP Đà Lạt)
  "718": { lat: 10.9803, lng: 106.6519 }, // Bình Dương (TP Thủ Dầu Một)
  "747": { lat: 10.4965, lng: 107.1685 }, // Bà Rịa Vũng Tàu (TP Vũng Tàu)
  "794": { lat: 10.5367, lng: 106.4062 }, // Long An (TP Tân An)
};
