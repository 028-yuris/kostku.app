import 'package:flutter_test/flutter_test.dart';
import 'package:kostku/main.dart';

void main() {
  testWidgets('KostKu landing app renders top bar and bottom navigation', (WidgetTester tester) async {
    await tester.pumpWidget(const KostkuApp());
    expect(find.text('KostKu'), findsOneWidget);
    expect(find.text('Beranda'), findsOneWidget);
    expect(find.text('Cari'), findsOneWidget);
    expect(find.text('Cara Kerja'), findsOneWidget);
    expect(find.text('Bantuan'), findsOneWidget);
  });
}
