# Troubleshooting: Cannot Fetch Steam Inventory

## Issue

Getting error when trying to fetch CS2 inventory with trade-protected items (yellow shield icons).

## Common Causes & Solutions

### 1. Steam Profile Privacy Settings ⚙️

**Problem**: Your Steam profile is set to private, preventing the API from accessing your inventory.

**Solution**:

1. Go to your Steam profile
2. Click **"Edit Profile"** → **"Privacy Settings"**
3. Set the following to **PUBLIC**:
    - **"My profile"**: Public
    - **"Game details"**: Public
    - **"Inventory"**: Public ← **MOST IMPORTANT**
4. Click **"Save"**

**Verify**: After changing settings, visit this URL in your browser:

```
https://steamcommunity.com/inventory/<YOUR_STEAM_ID>/730/2
```

Replace `<YOUR_STEAM_ID>` with your Steam64 ID. You should see your CS2 inventory in JSON format.

---

### 2. Backend Server Not Running 🖥️

**Problem**: The Express.js backend server isn't running.

**Check**:
Open browser console (F12) and look for error messages like:

-   `Failed to connect to backend API`
-   `Failed to fetch`
-   `net::ERR_CONNECTION_REFUSED`

**Solution**:

1. Open a terminal in the `api` folder:

    ```bash
    cd api
    ```

2. Start the backend server:

    ```bash
    npm start
    ```

3. You should see:

    ```
    Server running on port 5000
    ```

4. Test the backend by visiting:
    ```
    http://localhost:5000/api/health
    ```
    You should see a JSON response.

---

### 3. Invalid Steam ID Format 🔢

**Problem**: Using the wrong type of Steam ID.

**What you need**: Steam64 ID (17-digit number like `76561198012345678`)

**How to find it**:

1. Visit https://steamid.io/
2. Enter your Steam profile URL or username
3. Copy the **"steamID64"** value (looks like `76561198012345678`)

**NOT these formats**:

-   ❌ Steam username: `myusername`
-   ❌ Custom URL: `customurl`
-   ❌ Steam3 ID: `[U:1:123456]`
-   ❌ SteamID: `STEAM_0:0:123456`

---

### 4. Trade-Protected Items Are Normal ✅

**Important**: Items with the yellow shield icon (Trade Protected) are **NORMAL** and **should be fetched**.

-   These items are temporarily trade-locked (usually for 7 days)
-   They are still in your inventory
-   The API can see them if your profile is public
-   The frontend filters them by default with the "Show Protected Items" checkbox

**How the filter works**:

-   ✅ **Checked** (default): Shows ALL items including protected ones
-   ❌ **Unchecked**: Hides protected items from the grid

---

## Step-by-Step Debugging Process

### Step 1: Check Browser Console

1. Open your browser's Developer Tools (Press `F12`)
2. Go to the **Console** tab
3. Look for these log messages:

**Good signs** ✅:

```
📦 Fetching inventory for Steam ID: 76561198012345678
📦 Backend API URL: http://localhost:5000/api/steam/inventory/76561198012345678
✅ Successfully fetched 20 weapon skins from 62 total items
```

**Bad signs** ❌:

```
❌ Backend API returned 403: Profile is private
❌ Failed to connect to backend API: Failed to fetch
❌ No CS2 weapon skins found in your inventory
```

### Step 2: Check Backend Server Logs

In your backend terminal, you should see:

**Good** ✅:

```
GET /api/steam/inventory/76561198012345678
📦 Method 3: Trying standard JSON endpoint...
📡 Response status: 200
✅ Successfully fetched via standard endpoint
✅ Returning inventory with 62 items
```

**Bad** ❌:

```
❌ All methods failed
❌ Profile is private
```

### Step 3: Test Inventory URL Directly

Open this URL in your browser (replace with your Steam ID):

```
https://steamcommunity.com/inventory/76561198012345678/730/2
```

**Expected result**:

-   You should see JSON data with `"success": 1`
-   There should be an `"assets"` array with your items
-   There should be a `"descriptions"` array with item details

**If you see an error**:

-   `{"success":false}` → Profile is private
-   Page doesn't load → Invalid Steam ID

### Step 4: Verify Item Count

Based on your screenshot, you should see approximately:

-   **Total items**: ~60+ items
-   **Weapon skins**: ~15-20 items (guns only)
-   **Other items**: Graffiti, cases, stickers, collectibles (filtered out)

**Note**: The frontend only shows **weapon skins** (Rifle, Pistol, SMG, Shotgun, Knife, Gloves). It filters out:

-   Graffiti
-   Cases
-   Stickers
-   Collectibles
-   Service medals
-   Music kits

---

## Quick Fix Checklist

1. ✅ Steam profile privacy is set to PUBLIC
2. ✅ Backend server is running (`npm start` in `/api` folder)
3. ✅ Using correct Steam64 ID (17 digits)
4. ✅ Can access inventory URL directly in browser
5. ✅ "Show Protected Items" filter is CHECKED
6. ✅ Browser console shows successful fetch logs
7. ✅ Backend logs show successful inventory fetch

---

## Still Not Working?

### Check CORS Issues

If you see CORS errors in console:

```
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:5173' has been blocked
```

**Solution**: Make sure your backend has CORS enabled. Check `api/src/index.js`:

```javascript
import cors from "cors";

app.use(
	cors({
		origin: "http://localhost:5173", // Your frontend URL
		credentials: true,
	})
);
```

### Check Network Tab

1. Open Developer Tools (F12)
2. Go to **Network** tab
3. Filter by **XHR** or **Fetch**
4. Look for the request to `/api/steam/inventory/...`
5. Check the **Response** tab to see what data was returned
6. Check the **Headers** tab to see status code

### Get Support

If none of this works, check:

1. **Frontend console** for errors
2. **Backend logs** for errors
3. **Network tab** for failed requests
4. Provide these details when asking for help

---

## Example Working Flow

1. User enters Steam ID: `76561198012345678`
2. Frontend calls: `http://localhost:5000/api/steam/inventory/76561198012345678`
3. Backend fetches from Steam: `https://steamcommunity.com/inventory/76561198012345678/730/2`
4. Steam returns 62 items (including trade-protected ones)
5. Backend returns all 62 items to frontend
6. Frontend filters to ~20 weapon skins
7. Frontend displays items with "Show Protected Items" checked by default
8. User can toggle checkbox to hide/show protected items

---

## Understanding Protected Items

**What are Protected Items?**

-   Items with the yellow shield icon in Steam
-   Cannot be traded for 7 days after acquiring
-   Can still be used in-game
-   Visible in your inventory

**Why are they protected?**

-   Recently purchased from Steam Market
-   Recently received in a trade
-   Recently unboxed from a case
-   Security measure to prevent fraud

**Will they show in the app?**

-   ✅ YES - if your profile is public
-   ✅ YES - if "Show Protected Items" is checked
-   ❌ NO - if "Show Protected Items" is unchecked
