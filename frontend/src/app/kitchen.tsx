// Rescue Kitchen: recipes + shelf-life hacks for the last scanned item, from POST /recipes.
import { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, labelColors, labelNames } from "../lib/theme";
import type { SuccessResult } from "../lib/types";
import { getLastResult } from "../lib/storage";
import { getRecipes, RecipesResult } from "../lib/recipes";
import Shell from "../components/Shell";
import { Card, Eyebrow, Pill, SectionTitle } from "../components/ui";

export default function KitchenScreen() {
  const router = useRouter();
  const [last, setLast] = useState<{ result: SuccessResult; uri: string } | null>(null);
  const [data, setData] = useState<RecipesResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<number | null>(0);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    const l = await getLastResult();
    setLast(l);
    if (!l) {
      setLoading(false);
      return;
    }
    const r = await getRecipes(l.result);
    setData(r);
    setFailed(!r);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (!loading && !last) {
    return (
      <Shell>
        <Card style={{ alignItems: "center", paddingVertical: 40 }}>
          <Text style={styles.emptyTitle}>Nothing to rescue yet</Text>
          <Text style={styles.muted}>Scan an item and recipes for it show up here.</Text>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={() => router.replace("/")}>
            <Text style={styles.primaryBtnText}>Go to Inspect Studio</Text>
          </TouchableOpacity>
        </Card>
      </Shell>
    );
  }

  const r = last?.result;

  return (
    <Shell>
      {r && last && (
        <Card style={styles.header}>
          <Image source={{ uri: last.uri }} style={styles.thumb} />
          <View style={{ flex: 1, minWidth: 180 }}>
            <Eyebrow>Rescuing</Eyebrow>
            <Text style={styles.title}>{r.item.name}</Text>
            <Text style={styles.muted2}>
              Score {r.freshness.score}/100 ·{" "}
              {r.freshness.estimated_days_left === null ? "window unknown" : `${r.freshness.estimated_days_left} days left`}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: labelColors[r.freshness.label] }]}>
            <Text style={styles.badgeText}>{labelNames[r.freshness.label]}</Text>
          </View>
        </Card>
      )}

      <View style={styles.headRow}>
        <View>
          <Eyebrow>Rescue engine</Eyebrow>
          <SectionTitle>Tailored rescue recipes</SectionTitle>
        </View>
      </View>

      {loading ? (
        <Card style={{ alignItems: "center", paddingVertical: 40 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>Cooking up ideas...</Text>
        </Card>
      ) : failed || !data ? (
        <Card style={{ alignItems: "center", paddingVertical: 30 }}>
          <Text style={styles.emptyTitle}>Couldn't load recipes</Text>
          <Text style={styles.muted}>The server might be waking up. Try again in a few seconds.</Text>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={load}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <>
          <View style={styles.grid}>
            {data.recipes.map((rec, i) => {
              const isOpen = open === i;
              return (
                <Card key={i} style={[styles.recipe, i === 0 && styles.recipeFeatured]}>
                  {rec.image_url ? (
                    <Image source={{ uri: rec.image_url }} style={[styles.recipeImg, i === 0 && styles.recipeImgBig]} />
                  ) : (
                    <View style={[styles.recipeImg, styles.recipeImgEmpty, i === 0 && styles.recipeImgBig]}>
                      <Text style={{ fontSize: 32 }}>🍳</Text>
                    </View>
                  )}
                  {i === 0 && <Pill yellow>Top rescue match</Pill>}
                  <View style={styles.metaRow}>
                    <Text style={styles.meta}>⏱ {rec.time_minutes} min</Text>
                    <Text style={styles.meta}>· {rec.difficulty}</Text>
                  </View>
                  <Text style={styles.recipeTitle}>{rec.title}</Text>
                  <Text style={styles.recipeDesc}>{rec.description}</Text>

                  {isOpen && (
                    <View style={styles.detail}>
                      <Eyebrow>Ingredients</Eyebrow>
                      {rec.ingredients.map((ing, k) => (
                        <Text key={k} style={styles.detailLine}>• {ing}</Text>
                      ))}
                      <View style={{ height: 10 }} />
                      <Eyebrow>Steps</Eyebrow>
                      {rec.steps.map((s, k) => (
                        <Text key={k} style={styles.detailLine}>{k + 1}. {s}</Text>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={i === 0 ? styles.primaryBtn : styles.outlineBtn}
                    onPress={() => setOpen(isOpen ? null : i)}
                  >
                    <Text style={i === 0 ? styles.primaryBtnText : styles.outlineBtnText}>
                      {isOpen ? "Hide recipe" : "View recipe"}
                    </Text>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>

          {data.recipes.some((rec) => rec.image_url) && (
            <Text style={styles.credit}>Photos from Unsplash</Text>
          )}

          {data.hacks.length > 0 && (
            <>
              <View style={styles.headRow}>
                <View>
                  <Eyebrow>Make it last</Eyebrow>
                  <SectionTitle>Shelf-life extension hacks</SectionTitle>
                </View>
              </View>
              <View style={styles.grid}>
                {data.hacks.map((h, i) => (
                  <Card key={i} style={styles.hack}>
                    <View style={styles.hackIcon}>
                      <Text style={{ fontSize: 16 }}>🛡</Text>
                    </View>
                    <Text style={styles.recipeTitle}>{h.title}</Text>
                    <Text style={styles.recipeDesc}>{h.description}</Text>
                    {h.steps.map((s, k) => (
                      <Text key={k} style={styles.detailLine}>✓ {s}</Text>
                    ))}
                  </Card>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </Shell>
  );
}

const styles = StyleSheet.create({
  muted: { fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 6 },
  muted2: { fontSize: 13, color: colors.muted, marginTop: 4 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  header: { flexDirection: "row", alignItems: "center", gap: 16, flexWrap: "wrap", backgroundColor: colors.yellowSoft, borderColor: colors.yellow },
  thumb: { width: 70, height: 70, borderRadius: 14, backgroundColor: colors.border },
  title: { fontSize: 26, fontWeight: "800", color: colors.text, textTransform: "capitalize", marginTop: 2 },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  headRow: { marginTop: 24, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  recipe: { flexGrow: 1, flexBasis: 260, gap: 8 },
  recipeImg: { width: "100%", height: 150, borderRadius: 12, backgroundColor: colors.yellowSoft },
  recipeImgBig: { height: 200 },
  recipeImgEmpty: { alignItems: "center", justifyContent: "center" },
  credit: { fontSize: 11, color: colors.muted, marginTop: 8 },
  recipeFeatured: { flexBasis: 360, borderColor: colors.primary, borderWidth: 1.5 },
  metaRow: { flexDirection: "row", gap: 6 },
  meta: { fontSize: 12, color: colors.muted, textTransform: "capitalize" },
  recipeTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  recipeDesc: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  detail: { backgroundColor: colors.soft, borderRadius: 12, padding: 12, marginTop: 4 },
  detailLine: { fontSize: 14, color: colors.text, marginTop: 4, lineHeight: 20 },
  hack: { flexGrow: 1, flexBasis: 300, gap: 6 },
  hackIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.yellow, alignItems: "center", justifyContent: "center" },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, alignItems: "center", marginTop: 6 },
  primaryBtnText: { color: colors.primaryText, fontWeight: "700", fontSize: 14 },
  outlineBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 18, alignItems: "center", marginTop: 6 },
  outlineBtnText: { color: colors.text, fontWeight: "600", fontSize: 14 },
});
