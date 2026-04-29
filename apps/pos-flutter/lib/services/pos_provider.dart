import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

class CartItem {
  final String productId;
  final String name;
  final double price;
  int quantity;

  CartItem({
    required this.productId,
    required this.name,
    required this.price,
    this.quantity = 1,
  });

  double get total => price * quantity;
}

class PosProvider with ChangeNotifier {
  final List<CartItem> _items = [];
  bool _isOnline = true;
  final Dio _dio = Dio(BaseOptions(baseUrl: 'http://localhost:4000/api/v1'));
  final _uuid = const Uuid();

  List<CartItem> get items => _items;
  bool get isOnline => _isOnline;
  double get grandTotal => _items.fold(0, (sum, item) => sum + item.total);

  void setOnlineStatus(bool status) {
    _isOnline = status;
    notifyListeners();
  }

  Future<void> searchAndAddByBarcode(String barcode) async {
    try {
      // 1. Search API
      final response = await _dio.get('/inventory/products/barcode/$barcode');
      
      if (response.data['success'] == true) {
        final product = response.data['data'];
        addToCart(
          product['id'],
          product['name'],
          double.parse(product['salePrice'].toString()),
        );
      }
    } catch (e) {
      debugPrint('Product not found: $barcode');
      throw Exception('Product not found');
    }
  }

  void addToCart(String id, String name, double price) {
    final existingIndex = _items.indexWhere((item) => item.productId == id);
    if (existingIndex >= 0) {
      _items[existingIndex].quantity++;
    } else {
      _items.add(CartItem(productId: id, name: name, price: price));
    }
    notifyListeners();
  }

  void removeFromCart(String id) {
    _items.removeWhere((item) => item.productId == id);
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }

  Future<void> checkout() async {
    if (_items.isEmpty) return;

    final orderData = {
      'items': _items.map((item) => {
        'productId': item.productId,
        'quantity': item.quantity,
      }).toList(),
      'idempotencyKey': _uuid.v4(),
    };

    try {
      if (_isOnline) {
        await _dio.post('/pos/orders', data: orderData);
        clearCart();
      } else {
        // Here you would save to Hive for offline sync
        debugPrint('Offline: Saving to local queue...');
      }
    } catch (e) {
      debugPrint('Checkout failed: $e');
      rethrow;
    }
  }
}
