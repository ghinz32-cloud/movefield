/** Existing linked references. Their presence is not a claim of current full-text review. */
declare let evidenceLinks: Record<string, {
    name: string;
    url: string;
    summary: string;
}>;
declare function evidenceReview(id: string): string;
export { evidenceLinks };
export { evidenceReview };
