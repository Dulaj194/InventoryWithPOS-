import 'package:flutter/material.dart';

void main() {
  runApp(const PosApp());
}

class PosApp extends StatelessWidget {
  const PosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'myPosSystem POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF154D71)),
      ),
      home: const PosHomePage(),
    );
  }
}

class PosHomePage extends StatelessWidget {
  const PosHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('myPosSystem POS Terminal'),
      ),
      body: const Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Offline-First POS Starter',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            Text('Next implementation steps:'),
            Text('- Local cart + order queue with Hive'),
            Text('- Sync queued orders when internet returns'),
            Text('- Real-time order updates via websocket'),
          ],
        ),
      ),
    );
  }
}
