import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/pos_provider.dart';
import 'widgets/scanner_widget.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => PosProvider()),
      ],
      child: const PosApp(),
    ),
  );
}

class PosApp extends StatelessWidget {
  const PosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'myPosSystem POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF154D71),
          primary: const Color(0xFF154D71),
        ),
      ),
      home: const PosScreen(),
    );
  }
}

class PosScreen extends StatelessWidget {
  const PosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final pos = Provider.of<PosProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('POS Terminal', style: TextStyle(color: Colors.white)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        actions: [
          Icon(
            pos.isOnline ? Icons.cloud_done : Icons.cloud_off,
            color: pos.isOnline ? Colors.greenAccent : Colors.redAccent,
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Column(
        children: [
          // Cart List
          Expanded(
            child: pos.items.isEmpty
                ? const Center(child: Text('Cart is empty. Start scanning!'))
                : ListView.builder(
                    itemCount: pos.items.length,
                    itemBuilder: (context, index) {
                      final item = pos.items[index];
                      return ListTile(
                        title: Text(item.name),
                        subtitle: Text('${item.quantity} x \$${item.price}'),
                        trailing: Text(
                          '\$${item.total.toStringAsFixed(2)}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      );
                    },
                  ),
          ),
          
          // Bottom Panel
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.black12, blurRadius: 10, spreadRadius: 2)
              ],
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total:', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    Text(
                      '\$${pos.grandTotal.toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF154D71)),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ScannerWidget(
                                onScan: (code) async {
                                  try {
                                    await pos.searchAndAddByBarcode(code);
                                  } catch (e) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Product not found!'), backgroundColor: Colors.red),
                                    );
                                  }
                                },
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.qr_code_scanner),
                        label: const Text('SCAN'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          backgroundColor: Colors.blueGrey[50],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: pos.items.isEmpty ? null : () => pos.checkout(),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          backgroundColor: const Color(0xFF154D71),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('CHECKOUT'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
