module.exports = [
"[externals]/@prisma/client [external] (@prisma/client, cjs, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[externals]_@prisma_client_73c1ef61._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/@prisma/client [external] (@prisma/client, cjs)");
    });
});
}),
];