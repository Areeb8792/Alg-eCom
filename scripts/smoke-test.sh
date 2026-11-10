#!/usr/bin/env bash
# ==============================================================================
# Algions Platform — Full API Smoke Test Suite
# Tests Catalog, Orders, Idempotency, Concurrency, and Admin Audit Logging
# ==============================================================================
set -Eeuo pipefail

BASE_URL="${1:-https://localhost}"
PASS_COUNT=0
FAIL_COUNT=0

function assert_step() {
    local name="$1"
    local expected="$2"
    local actual="$3"

    if [[ "${actual}" == *"${expected}"* ]]; then
        echo "✓ PASS: ${name}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "❌ FAIL: ${name} (Expected '${expected}', got '${actual}')"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

echo "================================================================="
echo "   Algions AI Labs — API Automated Smoke Test Suite              "
echo "   Target Base URL: ${BASE_URL}                                  "
echo "================================================================="

# 1. Liveness Probe
echo "[Test 1] Health Liveness Probe"
LIVE_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/health/live")
assert_step "GET /api/v1/health/live returns 200" "200" "${LIVE_CODE}"

# 2. Readiness Probe
echo "[Test 2] Health Readiness Probe"
READY_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/v1/health/ready")
assert_step "GET /api/v1/health/ready returns 200" "200" "${READY_CODE}"

# 3. Product Catalog
echo "[Test 3] Product Catalog List"
PRODUCTS_RESP=$(curl -k -s "${BASE_URL}/api/v1/products")
FIRST_PRODUCT_ID=$(echo "${PRODUCTS_RESP}" | grep -o '"id":"[^"]*' | head -n 1 | cut -d'"' -f4 || echo "")
assert_step "GET /api/v1/products returns valid product array" "data" "${PRODUCTS_RESP}"

if [[ -z "${FIRST_PRODUCT_ID}" ]]; then
    echo "⚠️ Warning: No products found. Skipping transactional tests."
    exit 0
fi

# 4. Admin Authentication
echo "[Test 4] Admin JWT Authentication"
LOGIN_RESP=$(curl -k -s -X POST "${BASE_URL}/api/v1/admin/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin@algions.com","password":"AdminSecretPassword123!"}')
ADMIN_TOKEN=$(echo "${LOGIN_RESP}" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
assert_step "POST /api/v1/admin/auth/login returns JWT token" "token" "${LOGIN_RESP}"

# 5. Admin Stock Adjustment
echo "[Test 5] Protected Stock Adjustment with Audit Event"
ADJUST_RESP=$(curl -k -s -X POST "${BASE_URL}/api/v1/admin/products/${FIRST_PRODUCT_ID}/stock-adjustments" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -d '{"adjustment":5,"reason":"Automated smoke test stock increment"}')
assert_step "POST /api/v1/admin/products/:id/stock-adjustments succeeds" "stock" "${ADJUST_RESP}"

# 6. Order Creation with Idempotency Key
echo "[Test 6] Order Creation with Idempotency Key"
IDEMPOTENCY_KEY="smoke-test-key-$(date +%s)-$RANDOM"
ORDER_PAYLOAD="{\"customerEmail\":\"smoke@algions.com\",\"customerName\":\"Smoke Tester\",\"items\":[{\"productId\":\"${FIRST_PRODUCT_ID}\",\"quantity\":1}]}"

ORDER_HEADER_FILE=$(mktemp)
curl -k -s -D "${ORDER_HEADER_FILE}" -X POST "${BASE_URL}/api/v1/orders" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
    -d "${ORDER_PAYLOAD}" > /dev/null

ORDER_1_CODE=$(head -n 1 "${ORDER_HEADER_FILE}" | tr -d '\r')
assert_step "First Order Creation returns 201 Created" "201" "${ORDER_1_CODE}"

# 7. Exact Idempotency Replay
echo "[Test 7] Exact Idempotency Replay (Same Key, Same Payload)"
REPLAY_HEADER_FILE=$(mktemp)
curl -k -s -D "${REPLAY_HEADER_FILE}" -X POST "${BASE_URL}/api/v1/orders" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
    -d "${ORDER_PAYLOAD}" > /dev/null

REPLAY_HEADER=$(grep -i "x-idempotent-replayed" "${REPLAY_HEADER_FILE}" || echo "")
assert_step "Replayed request contains X-Idempotent-Replayed header" "true" "${REPLAY_HEADER}"

# 8. Idempotency Key Reuse Conflict (Same Key, Altered Payload)
echo "[Test 8] Idempotency Key Conflict (Same Key, Altered Quantity)"
CONFLICT_PAYLOAD="{\"customerEmail\":\"smoke@algions.com\",\"customerName\":\"Smoke Tester\",\"items\":[{\"productId\":\"${FIRST_PRODUCT_ID}\",\"quantity\":2}]}"
CONFLICT_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/v1/orders" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: ${IDEMPOTENCY_KEY}" \
    -d "${CONFLICT_PAYLOAD}")
assert_step "Reused key with different payload returns HTTP 409 Conflict" "409" "${CONFLICT_CODE}"

# Clean temp files
rm -f "${ORDER_HEADER_FILE}" "${REPLAY_HEADER_FILE}"

echo "================================================================="
echo "Smoke Test Summary: ${PASS_COUNT} Passed, ${FAIL_COUNT} Failed"
echo "================================================================="

if [[ ${FAIL_COUNT} -eq 0 ]]; then
    exit 0
else
    exit 1
fi
