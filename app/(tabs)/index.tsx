import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import {
  calculateTotalAmount,
  calculateTotalWeight,
  calculateWeightedAverage,
  formatQuantity,
  parseNumericInput,
} from "@/lib/sales-calculations";
import { loadSaleRecords, saveSaleRecords, type SaleRecord } from "@/lib/sales-storage";

const COLORS = {
  primary: "#087A55",
  primaryStrong: "#066447",
  primaryBright: "#10A86E",
  background: "#F8FCFA",
  surface: "#FFFFFF",
  softSurface: "#E8FBF2",
  border: "#C8EBDD",
  text: "#12372A",
  muted: "#678076",
  subtle: "#95A9A1",
  danger: "#B42318",
  white: "#FFFFFF",
};

const MAX_BASKETS = 30;

function getCurrentFormDateTime() {
  const now = new Date();
  const date = [now.getDate(), now.getMonth() + 1, now.getFullYear()]
    .map((part, index) => (index < 2 ? String(part).padStart(2, "0") : String(part)))
    .join("/");
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return { date, time };
}

function createSoldAt(date: string, time: string): string | null {
  const [day, month, year] = date.split("/").map((part) => Number(part));
  const [hour, minute] = time.split(":").map((part) => Number(part));
  const created = new Date(year, month - 1, day, hour, minute);

  if (
    !Number.isFinite(created.getTime()) ||
    created.getFullYear() !== year ||
    created.getMonth() !== month - 1 ||
    created.getDate() !== day ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return created.toISOString();
}

function createRecordId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function ActionButton({
  label,
  icon,
  onPress,
  variant = "primary",
}: {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  onPress: () => void;
  variant?: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        isPrimary ? styles.primaryActionButton : styles.secondaryActionButton,
        pressed && styles.pressed,
      ]}
    >
      <MaterialIcons color={COLORS.white} name={icon} size={21} />
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

function EmptyHistory() {
  return (
    <View style={styles.emptyHistory}>
      <View style={styles.emptyIconWrap}>
        <MaterialIcons color={COLORS.primaryBright} name="assignment" size={36} />
      </View>
      <Text style={styles.emptyHistoryTitle}>ยังไม่มีข้อมูลการขาย</Text>
      <Text style={styles.emptyHistoryDescription}>
        บันทึกรายการแรกของคุณเพื่อเริ่มดูประวัติและราคาเฉลี่ย
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const initialForm = getCurrentFormDateTime();
  const [saleDate, setSaleDate] = useState(initialForm.date);
  const [saleTime, setSaleTime] = useState(initialForm.time);
  const [pricePerKg, setPricePerKg] = useState("");
  const [basketWeights, setBasketWeights] = useState<string[]>([""]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [averageVisible, setAverageVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SaleRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<SaleRecord | null>(null);

  useEffect(() => {
    let isMounted = true;
    loadSaleRecords()
      .then((records) => {
        if (isMounted) {
          setSales(records);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFormError("ไม่สามารถอ่านข้อมูลในอุปกรณ์ได้ โปรดลองใหม่อีกครั้ง");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timeoutId);
  }, [notice]);

  const totalWeight = useMemo(() => calculateTotalWeight(basketWeights), [basketWeights]);
  const totalAmount = useMemo(
    () => calculateTotalAmount(basketWeights, pricePerKg),
    [basketWeights, pricePerKg],
  );
  const weightedAverage = useMemo(() => calculateWeightedAverage(sales), [sales]);
  const accumulatedWeight = useMemo(
    () => sales.reduce((sum, record) => sum + record.totalWeight, 0),
    [sales],
  );
  const accumulatedAmount = useMemo(
    () => sales.reduce((sum, record) => sum + record.totalAmount, 0),
    [sales],
  );

  const updateBasketWeight = (index: number, value: string) => {
    setFormError("");
    setBasketWeights((currentWeights) =>
      currentWeights.map((weight, currentIndex) => (currentIndex === index ? value : weight)),
    );
  };

  const addBasket = () => {
    if (basketWeights.length >= MAX_BASKETS) {
      setFormError(`เพิ่มได้สูงสุด ${MAX_BASKETS} เข่งต่อรายการ`);
      return;
    }

    setFormError("");
    setBasketWeights((currentWeights) => [...currentWeights, ""]);
  };

  const removeBasket = () => {
    if (basketWeights.length <= 1) {
      return;
    }

    setFormError("");
    setBasketWeights((currentWeights) => currentWeights.slice(0, -1));
  };

  const resetForm = () => {
    const nextDateTime = getCurrentFormDateTime();
    setSaleDate(nextDateTime.date);
    setSaleTime(nextDateTime.time);
    setPricePerKg("");
    setBasketWeights([""]);
  };

  const saveRecord = async () => {
    const parsedPrice = parseNumericInput(pricePerKg);
    const parsedWeights = basketWeights.map(parseNumericInput);
    const soldAt = createSoldAt(saleDate.trim(), saleTime.trim());

    if (!soldAt) {
      setFormError("โปรดระบุวันที่ในรูปแบบ วว/ดด/ปปปป และเวลาในรูปแบบ ชช:นน");
      return;
    }

    if (parsedPrice <= 0) {
      setFormError("โปรดระบุราคายางพาราที่มากกว่า 0 บาทต่อกิโลกรัม");
      return;
    }

    if (parsedWeights.some((weight) => weight <= 0)) {
      setFormError("โปรดระบุน้ำหนักที่มากกว่า 0 กิโลกรัมให้ครบทุกเข่ง");
      return;
    }

    const record: SaleRecord = {
      id: createRecordId(),
      soldAt,
      displayDate: saleDate.trim(),
      displayTime: saleTime.trim(),
      pricePerKg: parsedPrice,
      basketWeights: parsedWeights,
      totalWeight: calculateTotalWeight(parsedWeights),
      totalAmount: calculateTotalAmount(parsedWeights, parsedPrice),
      createdAt: new Date().toISOString(),
    };
    const nextSales = [record, ...sales];

    try {
      setFormError("");
      await saveSaleRecords(nextSales);
      setSales(nextSales);
      resetForm();
      setNotice("บันทึกข้อมูลการขายเรียบร้อยแล้ว");
    } catch {
      setFormError("บันทึกข้อมูลไม่สำเร็จ โปรดลองใหม่อีกครั้ง");
    }
  };

  const deleteRecord = async () => {
    if (!recordToDelete) {
      return;
    }

    const nextSales = sales.filter((record) => record.id !== recordToDelete.id);
    try {
      await saveSaleRecords(nextSales);
      setSales(nextSales);
      setSelectedRecord(null);
      setRecordToDelete(null);
      setNotice("ลบรายการขายเรียบร้อยแล้ว");
    } catch {
      setRecordToDelete(null);
      setFormError("ลบข้อมูลไม่สำเร็จ โปรดลองใหม่อีกครั้ง");
    }
  };

  const header = (
    <View style={styles.contentColumn}>
      <View style={styles.brandHeader}>
        <View style={styles.brandIcon}>
          <Image
            accessibilityLabel="โลโก้ Rubber"
            source={require("../../assets/images/icon.png")}
            style={styles.brandIconImage}
          />
        </View>
        <View>
          <Text style={styles.brandTitle}>Rubber</Text>
          <Text style={styles.brandSubtitle}>ระบบจัดการรายยางพารา</Text>
        </View>
      </View>

      {notice ? (
        <View accessibilityLiveRegion="polite" style={styles.notice}>
          <MaterialIcons color={COLORS.primary} name="check-circle" size={20} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <View style={styles.formCard}>
        <View style={styles.cardHeadingRow}>
          <View style={styles.cardHeadingIcon}>
            <MaterialIcons color={COLORS.primary} name="edit-note" size={24} />
          </View>
          <View>
            <Text style={styles.cardTitle}>บันทึกการขาย</Text>
            <Text style={styles.cardDescription}>กรอกข้อมูลให้ครบเพื่อคำนวณยอดขายทันที</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>วัน เวลาที่ขาย</Text>
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeField}>
            <Text style={styles.fieldLabel}>วันที่</Text>
            <View style={styles.inputShell}>
              <MaterialIcons color={COLORS.primary} name="calendar-today" size={18} />
              <TextInput
                accessibilityLabel="วันที่ขาย"
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
                onChangeText={setSaleDate}
                placeholder="วว/ดด/ปปปป"
                placeholderTextColor={COLORS.subtle}
                style={styles.dateTimeInput}
                value={saleDate}
              />
            </View>
          </View>
          <View style={styles.dateTimeField}>
            <Text style={styles.fieldLabel}>เวลา</Text>
            <View style={styles.inputShell}>
              <MaterialIcons color={COLORS.primary} name="schedule" size={18} />
              <TextInput
                accessibilityLabel="เวลาขาย"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
                onChangeText={setSaleTime}
                placeholder="ช.น."
                placeholderTextColor={COLORS.subtle}
                style={styles.dateTimeInput}
                value={saleTime}
              />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ราคายางพารา <Text style={styles.unitHint}>(บาท/กก.)</Text></Text>
        <View style={styles.largeInputShell}>
          <MaterialIcons color={COLORS.primary} name="payments" size={22} />
          <TextInput
            accessibilityLabel="ราคายางพาราต่อกิโลกรัม"
            inputMode="decimal"
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
            onChangeText={(value) => {
              setFormError("");
              setPricePerKg(value.replace(/[^0-9.,]/g, ""));
            }}
            placeholder="เช่น 50.00"
            placeholderTextColor={COLORS.subtle}
            style={styles.largeInput}
            value={pricePerKg}
          />
        </View>

        <View style={styles.quantityHeading}>
          <View>
            <Text style={styles.sectionTitle}>จำนวนเข่ง</Text>
            <Text style={styles.helperText}>เพิ่มตามจำนวนภาชนะที่ชั่งจริง</Text>
          </View>
          <View style={styles.counter}>
            <Pressable
              accessibilityLabel="ลดจำนวนเข่ง"
              accessibilityRole="button"
              disabled={basketWeights.length <= 1}
              onPress={removeBasket}
              style={({ pressed }) => [
                styles.counterButton,
                basketWeights.length <= 1 && styles.counterButtonDisabled,
                pressed && basketWeights.length > 1 && styles.pressed,
              ]}
            >
              <MaterialIcons color={COLORS.white} name="remove" size={25} />
            </Pressable>
            <Text accessibilityLabel={`จำนวนเข่ง ${basketWeights.length}`} style={styles.counterValue}>
              {basketWeights.length}
            </Text>
            <Pressable
              accessibilityLabel="เพิ่มจำนวนเข่ง"
              accessibilityRole="button"
              onPress={addBasket}
              style={({ pressed }) => [styles.counterButton, pressed && styles.pressed]}
            >
              <MaterialIcons color={COLORS.white} name="add" size={25} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>น้ำหนักแต่ละเข่ง <Text style={styles.unitHint}>(กก.)</Text></Text>
        <View style={styles.basketList}>
          {basketWeights.map((weight, index) => (
            <View key={`basket-${index}`} style={styles.basketRow}>
              <View style={styles.basketBadge}>
                <Text style={styles.basketBadgeLabel}>เข่ง</Text>
                <Text style={styles.basketBadgeValue}>{index + 1}</Text>
              </View>
              <TextInput
                accessibilityLabel={`น้ำหนักเข่งที่ ${index + 1}`}
                inputMode="decimal"
                keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                onChangeText={(value) => updateBasketWeight(index, value.replace(/[^0-9.,]/g, ""))}
                placeholder="0.00"
                placeholderTextColor={COLORS.subtle}
                style={styles.weightInput}
                value={weight}
              />
              <Text style={styles.weightUnit}>กก.</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>รวมน้ำหนัก</Text>
            <Text style={styles.summaryValue}>{formatQuantity(totalWeight)} กก.</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>รวมเงิน</Text>
            <Text style={styles.summaryAmount}>{formatQuantity(totalAmount)} บาท</Text>
          </View>
        </View>

        {formError ? (
          <View accessibilityLiveRegion="polite" style={styles.errorBox}>
            <MaterialIcons color={COLORS.danger} name="error-outline" size={20} />
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <ActionButton icon="save" label="บันทึกข้อมูล" onPress={saveRecord} />
          <ActionButton icon="insights" label="ดูราคาเฉลี่ย" onPress={() => setAverageVisible(true)} variant="secondary" />
        </View>
      </View>

      <View style={styles.historyHeading}>
        <View>
          <Text style={styles.historyTitle}>ประวัติการบันทึก</Text>
          <Text style={styles.historySubtitle}>
            {isLoading ? "กำลังโหลดข้อมูล…" : `${sales.length} รายการที่บันทึกไว้ในอุปกรณ์นี้`}
          </Text>
        </View>
        <View style={styles.historyCountPill}>
          <Text style={styles.historyCountText}>{sales.length}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <StatusBar backgroundColor={COLORS.background} style="dark" />
      <FlatList
        data={sales}
        keyExtractor={(record) => record.id}
        ListEmptyComponent={isLoading ? null : <EmptyHistory />}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.contentColumn}>
            <Pressable
              accessibilityHint="เปิดดูรายละเอียดการขาย"
              accessibilityLabel={`รายการขายวันที่ ${item.displayDate}`}
              accessibilityRole="button"
              onPress={() => setSelectedRecord(item)}
              style={({ pressed }) => [styles.historyCard, pressed && styles.pressed]}
            >
              <View style={styles.historyCardTop}>
                <View style={styles.historyIconWrap}>
                  <MaterialIcons color={COLORS.primary} name="receipt-long" size={24} />
                </View>
                <View style={styles.historyCardIdentity}>
                  <Text style={styles.historyCardDate}>{item.displayDate}</Text>
                  <Text style={styles.historyCardTime}>{item.displayTime} น.</Text>
                </View>
                <MaterialIcons color={COLORS.subtle} name="chevron-right" size={24} />
              </View>
              <View style={styles.historyMetrics}>
                <View>
                  <Text style={styles.metricLabel}>น้ำหนัก</Text>
                  <Text style={styles.metricValue}>{formatQuantity(item.totalWeight)} กก.</Text>
                </View>
                <View style={styles.metricRight}>
                  <Text style={styles.metricLabel}>ยอดขาย</Text>
                  <Text style={styles.metricAmount}>{formatQuantity(item.totalAmount)} บาท</Text>
                </View>
              </View>
            </Pressable>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      <Modal
        animationType="slide"
        onRequestClose={() => setAverageVisible(false)}
        transparent
        visible={averageVisible}
      >
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="ปิดหน้าต่างราคาเฉลี่ย" onPress={() => setAverageVisible(false)} style={StyleSheet.absoluteFill} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <View>
                <Text style={styles.sheetEyebrow}>ภาพรวมการขาย</Text>
                <Text style={styles.sheetTitle}>ราคาเฉลี่ย</Text>
              </View>
              <Pressable accessibilityLabel="ปิด" onPress={() => setAverageVisible(false)} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                <MaterialIcons color={COLORS.text} name="close" size={22} />
              </Pressable>
            </View>
            <View style={styles.averageHero}>
              <Text style={styles.averageHeroLabel}>ราคาเฉลี่ยแบบถ่วงน้ำหนัก</Text>
              <Text style={styles.averageHeroValue}>{formatQuantity(weightedAverage)} <Text style={styles.averageHeroUnit}>บาท/กก.</Text></Text>
            </View>
            <View style={styles.averageStats}>
              <View style={styles.averageStat}>
                <Text style={styles.metricLabel}>น้ำหนักสะสม</Text>
                <Text style={styles.averageStatValue}>{formatQuantity(accumulatedWeight)} กก.</Text>
              </View>
              <View style={styles.averageVerticalDivider} />
              <View style={styles.averageStat}>
                <Text style={styles.metricLabel}>ยอดขายสะสม</Text>
                <Text style={styles.averageStatValue}>{formatQuantity(accumulatedAmount)} บาท</Text>
              </View>
            </View>
            <Text style={styles.sheetNote}>คำนวณจากยอดเงินรวม ÷ น้ำหนักรวมของรายการที่บันทึกทั้งหมด</Text>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setSelectedRecord(null)}
        transparent
        visible={selectedRecord !== null}
      >
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="ปิดรายละเอียดรายการ" onPress={() => setSelectedRecord(null)} style={StyleSheet.absoluteFill} />
          <View style={styles.detailSheet}>
            <View style={styles.sheetHandle} />
            {selectedRecord ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.sheetTitleRow}>
                  <View>
                    <Text style={styles.sheetEyebrow}>รายละเอียดรายการขาย</Text>
                    <Text style={styles.sheetTitle}>{selectedRecord.displayDate}</Text>
                    <Text style={styles.detailTime}>{selectedRecord.displayTime} น.</Text>
                  </View>
                  <Pressable accessibilityLabel="ปิด" onPress={() => setSelectedRecord(null)} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                    <MaterialIcons color={COLORS.text} name="close" size={22} />
                  </Pressable>
                </View>
                <View style={styles.detailHero}>
                  <View>
                    <Text style={styles.metricLabel}>ยอดขายทั้งหมด</Text>
                    <Text style={styles.detailHeroValue}>{formatQuantity(selectedRecord.totalAmount)} บาท</Text>
                  </View>
                  <MaterialIcons color={COLORS.primaryBright} name="account-balance-wallet" size={34} />
                </View>
                <View style={styles.detailFacts}>
                  <View style={styles.detailFact}>
                    <Text style={styles.metricLabel}>ราคายาง</Text>
                    <Text style={styles.detailFactValue}>{formatQuantity(selectedRecord.pricePerKg)} บาท/กก.</Text>
                  </View>
                  <View style={styles.detailFact}>
                    <Text style={styles.metricLabel}>รวมน้ำหนัก</Text>
                    <Text style={styles.detailFactValue}>{formatQuantity(selectedRecord.totalWeight)} กก.</Text>
                  </View>
                </View>
                <Text style={styles.detailSectionTitle}>น้ำหนักแยกตามเข่ง</Text>
                <View style={styles.detailBasketList}>
                  {selectedRecord.basketWeights.map((weight, index) => (
                    <View key={`${selectedRecord.id}-weight-${index}`} style={styles.detailBasketRow}>
                      <Text style={styles.detailBasketIndex}>เข่ง {index + 1}</Text>
                      <Text style={styles.detailBasketWeight}>{formatQuantity(weight)} กก.</Text>
                    </View>
                  ))}
                </View>
                <Pressable
                  accessibilityLabel="ลบรายการนี้"
                  onPress={() => setRecordToDelete(selectedRecord)}
                  style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
                >
                  <MaterialIcons color={COLORS.danger} name="delete-outline" size={21} />
                  <Text style={styles.deleteButtonText}>ลบรายการนี้</Text>
                </Pressable>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setRecordToDelete(null)}
        transparent
        visible={recordToDelete !== null}
      >
        <View style={styles.confirmationBackdrop}>
          <View style={styles.confirmationCard}>
            <View style={styles.confirmationIcon}>
              <MaterialIcons color={COLORS.danger} name="delete-outline" size={27} />
            </View>
            <Text style={styles.confirmationTitle}>ลบรายการขายนี้หรือไม่</Text>
            <Text style={styles.confirmationText}>รายการที่ลบจะไม่สามารถกู้คืนจากอุปกรณ์นี้ได้</Text>
            <View style={styles.confirmationActions}>
              <Pressable onPress={() => setRecordToDelete(null)} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </Pressable>
              <Pressable onPress={deleteRecord} style={({ pressed }) => [styles.confirmDeleteButton, pressed && styles.pressed]}>
                <Text style={styles.confirmDeleteText}>ลบรายการ</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingTop: 14, paddingBottom: 42 },
  contentColumn: { alignSelf: "center", width: "100%", maxWidth: 720, paddingHorizontal: 18 },
  brandHeader: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 20, paddingTop: 4 },
  brandIcon: { width: 48, height: 48, overflow: "hidden", borderRadius: 16, backgroundColor: "#D9F7E9" },
  brandIconImage: { width: 48, height: 48 },
  brandTitle: { color: COLORS.text, fontSize: 29, lineHeight: 35, fontWeight: "800", letterSpacing: -0.6 },
  brandSubtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 21, fontWeight: "500" },
  notice: { flexDirection: "row", gap: 9, alignItems: "center", borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.softSurface, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  noticeText: { flex: 1, color: COLORS.primaryStrong, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  formCard: { borderRadius: 24, borderWidth: 1, borderColor: "#D8EEE5", backgroundColor: COLORS.surface, padding: 18, shadowColor: "#0B5139", shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 2 },
  cardHeadingRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingBottom: 16, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: "#E7F4EE" },
  cardHeadingIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.softSurface },
  cardTitle: { color: COLORS.text, fontSize: 19, lineHeight: 25, fontWeight: "800" },
  cardDescription: { color: COLORS.muted, marginTop: 1, fontSize: 12, lineHeight: 18 },
  sectionTitle: { color: COLORS.text, fontSize: 17, lineHeight: 24, fontWeight: "800", marginBottom: 9 },
  unitHint: { color: COLORS.muted, fontSize: 14, fontWeight: "600" },
  dateTimeRow: { flexDirection: "row", gap: 11, marginBottom: 21 },
  dateTimeField: { flex: 1, minWidth: 0 },
  fieldLabel: { color: COLORS.muted, fontSize: 13, lineHeight: 19, fontWeight: "600", marginBottom: 6 },
  inputShell: { height: 49, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, backgroundColor: "#FCFFFD", paddingHorizontal: 11 },
  dateTimeInput: { flex: 1, minWidth: 0, color: COLORS.text, fontSize: 14, fontWeight: "700", padding: 0 },
  largeInputShell: { height: 58, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, backgroundColor: "#FCFFFD", paddingHorizontal: 15, marginBottom: 23 },
  largeInput: { flex: 1, color: COLORS.text, fontSize: 19, lineHeight: 25, fontWeight: "700", padding: 0 },
  quantityHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 17 },
  helperText: { color: COLORS.muted, fontSize: 12, lineHeight: 17 },
  counter: { flexDirection: "row", alignItems: "center", gap: 12 },
  counterButton: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, shadowColor: COLORS.primaryStrong, shadowOpacity: 0.16, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  counterButtonDisabled: { backgroundColor: "#B9D7CA", shadowOpacity: 0 },
  counterValue: { color: COLORS.text, minWidth: 24, textAlign: "center", fontSize: 25, lineHeight: 31, fontWeight: "800" },
  basketList: { gap: 10, marginBottom: 20 },
  basketRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  basketBadge: { width: 42, alignItems: "center" },
  basketBadgeLabel: { color: COLORS.primary, fontSize: 12, lineHeight: 15, fontWeight: "700" },
  basketBadgeValue: { color: COLORS.primary, fontSize: 17, lineHeight: 21, fontWeight: "800" },
  weightInput: { flex: 1, minWidth: 0, height: 51, color: COLORS.text, fontSize: 17, fontWeight: "700", borderWidth: 1, borderColor: COLORS.border, borderRadius: 15, backgroundColor: "#FCFFFD", paddingHorizontal: 14 },
  weightUnit: { width: 30, color: COLORS.muted, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  summaryCard: { borderRadius: 18, borderWidth: 1, borderColor: "#D2F1E2", backgroundColor: COLORS.softSurface, paddingHorizontal: 15, paddingVertical: 14, marginBottom: 15 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  summaryLabel: { color: COLORS.primaryStrong, fontSize: 15, lineHeight: 22, fontWeight: "700" },
  summaryValue: { color: COLORS.text, fontSize: 18, lineHeight: 25, fontWeight: "800" },
  summaryAmount: { color: COLORS.primary, fontSize: 21, lineHeight: 27, fontWeight: "900" },
  summaryDivider: { height: 1, backgroundColor: "#C9EBD9", marginVertical: 10 },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 13, backgroundColor: "#FFF0EE", paddingHorizontal: 12, paddingVertical: 11, marginBottom: 14 },
  errorText: { flex: 1, color: COLORS.danger, fontSize: 13, lineHeight: 19, fontWeight: "600" },
  actions: { gap: 10 },
  actionButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: 17, paddingHorizontal: 18 },
  primaryActionButton: { backgroundColor: COLORS.primary },
  secondaryActionButton: { backgroundColor: COLORS.primaryBright },
  actionButtonText: { color: COLORS.white, fontSize: 16, lineHeight: 22, fontWeight: "800" },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  historyHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 28, marginBottom: 13 },
  historyTitle: { color: COLORS.text, fontSize: 21, lineHeight: 27, fontWeight: "800" },
  historySubtitle: { color: COLORS.muted, marginTop: 2, fontSize: 12, lineHeight: 18 },
  historyCountPill: { minWidth: 32, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#DDF5E9", paddingHorizontal: 9 },
  historyCountText: { color: COLORS.primaryStrong, fontSize: 13, fontWeight: "800" },
  emptyHistory: { width: "100%", maxWidth: 720, alignSelf: "center", alignItems: "center", paddingHorizontal: 36, paddingTop: 35, paddingBottom: 45 },
  emptyIconWrap: { width: 68, height: 68, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#EEFFF6", marginBottom: 13 },
  emptyHistoryTitle: { color: COLORS.text, fontSize: 16, lineHeight: 23, fontWeight: "800", textAlign: "center" },
  emptyHistoryDescription: { color: COLORS.muted, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 5 },
  historyCard: { borderRadius: 18, borderWidth: 1, borderColor: "#DDEEE6", backgroundColor: COLORS.surface, padding: 15, marginBottom: 10, shadowColor: "#0B5139", shadowOpacity: 0.04, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  historyCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyIconWrap: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.softSurface },
  historyCardIdentity: { flex: 1 },
  historyCardDate: { color: COLORS.text, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  historyCardTime: { color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 1 },
  historyMetrics: { flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#EDF5F1" },
  metricRight: { alignItems: "flex-end" },
  metricLabel: { color: COLORS.muted, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  metricValue: { color: COLORS.text, fontSize: 15, lineHeight: 22, fontWeight: "800", marginTop: 2 },
  metricAmount: { color: COLORS.primary, fontSize: 16, lineHeight: 22, fontWeight: "900", marginTop: 2 },
  modalRoot: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(8, 42, 30, 0.36)" },
  bottomSheet: { width: "100%", maxWidth: 720, alignSelf: "center", borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingTop: 11, paddingBottom: 32 },
  detailSheet: { width: "100%", maxWidth: 720, maxHeight: "88%", alignSelf: "center", borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: COLORS.surface, paddingHorizontal: 20, paddingTop: 11, paddingBottom: 28 },
  sheetHandle: { alignSelf: "center", width: 42, height: 5, borderRadius: 4, backgroundColor: "#C9D9D2", marginBottom: 20 },
  sheetTitleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  sheetEyebrow: { color: COLORS.primary, fontSize: 13, lineHeight: 19, fontWeight: "800" },
  sheetTitle: { color: COLORS.text, fontSize: 26, lineHeight: 33, fontWeight: "900", letterSpacing: -0.3 },
  closeButton: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#EFF6F2" },
  averageHero: { borderRadius: 21, backgroundColor: COLORS.primary, marginTop: 22, padding: 19 },
  averageHeroLabel: { color: "#CFF5E2", fontSize: 14, lineHeight: 20, fontWeight: "700" },
  averageHeroValue: { color: COLORS.white, fontSize: 35, lineHeight: 43, fontWeight: "900", marginTop: 4, letterSpacing: -0.5 },
  averageHeroUnit: { color: "#D9F7E9", fontSize: 17, lineHeight: 24, fontWeight: "700" },
  averageStats: { flexDirection: "row", alignItems: "stretch", borderWidth: 1, borderColor: "#E0EEE7", borderRadius: 17, marginTop: 14, paddingVertical: 14 },
  averageStat: { flex: 1, paddingHorizontal: 13 },
  averageVerticalDivider: { width: 1, backgroundColor: "#E0EEE7" },
  averageStatValue: { color: COLORS.text, fontSize: 14, lineHeight: 21, fontWeight: "800", marginTop: 3 },
  sheetNote: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 14 },
  detailTime: { color: COLORS.muted, fontSize: 14, lineHeight: 20, fontWeight: "600", marginTop: 1 },
  detailHero: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 19, backgroundColor: COLORS.softSurface, padding: 16, marginTop: 20 },
  detailHeroValue: { color: COLORS.primary, fontSize: 26, lineHeight: 33, fontWeight: "900", marginTop: 2 },
  detailFacts: { flexDirection: "row", gap: 10, marginTop: 13 },
  detailFact: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: "#E0EEE7", padding: 13 },
  detailFactValue: { color: COLORS.text, fontSize: 14, lineHeight: 21, fontWeight: "800", marginTop: 3 },
  detailSectionTitle: { color: COLORS.text, fontSize: 17, lineHeight: 24, fontWeight: "800", marginTop: 21, marginBottom: 9 },
  detailBasketList: { borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#E0EEE7" },
  detailBasketRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#EDF5F1" },
  detailBasketIndex: { color: COLORS.muted, fontSize: 14, lineHeight: 20, fontWeight: "600" },
  detailBasketWeight: { color: COLORS.text, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  deleteButton: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 16, borderWidth: 1, borderColor: "#F4C9C2", backgroundColor: "#FFF7F6", marginTop: 19 },
  deleteButtonText: { color: COLORS.danger, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  confirmationBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8, 42, 30, 0.46)", padding: 22 },
  confirmationCard: { width: "100%", maxWidth: 390, borderRadius: 24, backgroundColor: COLORS.surface, padding: 21 },
  confirmationIcon: { width: 49, height: 49, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0EE", marginBottom: 14 },
  confirmationTitle: { color: COLORS.text, fontSize: 20, lineHeight: 27, fontWeight: "900" },
  confirmationText: { color: COLORS.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  confirmationActions: { flexDirection: "row", gap: 10, marginTop: 21 },
  cancelButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 15, borderWidth: 1, borderColor: "#DDEBE4" },
  cancelButtonText: { color: COLORS.text, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  confirmDeleteButton: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: COLORS.danger },
  confirmDeleteText: { color: COLORS.white, fontSize: 15, lineHeight: 21, fontWeight: "800" },
});
