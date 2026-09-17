import pytest


async def _register(client, email):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "TestPassword123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    return data["access_token"], data["user"]["id"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_org(client):
    token, _ = await _register(client, "org1@example.com")
    resp = await client.post(
        "/api/v1/organizations",
        json={"name": "Bright Cuts Barbershop"},
        headers=_auth(token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Bright Cuts Barbershop"
    assert data["slug"] == "bright-cuts-barbershop"
    assert data["role"] == "OWNER"


@pytest.mark.asyncio
async def test_slug_uniqueness(client):
    token, _ = await _register(client, "org2@example.com")
    payload = {"name": "Same Name"}

    r1 = await client.post("/api/v1/organizations", json=payload, headers=_auth(token))
    r2 = await client.post("/api/v1/organizations", json=payload, headers=_auth(token))

    assert r1.json()["slug"] == "same-name"
    assert r2.json()["slug"] == "same-name-1"


@pytest.mark.asyncio
async def test_list_my_orgs(client):
    token, _ = await _register(client, "org3@example.com")
    await client.post(
        "/api/v1/organizations", json={"name": "Org A"}, headers=_auth(token)
    )
    await client.post(
        "/api/v1/organizations", json={"name": "Org B"}, headers=_auth(token)
    )

    resp = await client.get("/api/v1/organizations", headers=_auth(token))
    assert resp.status_code == 200
    assert len(resp.json()) == 2


@pytest.mark.asyncio
async def test_cross_tenant_isolation(client):
    """
    Critical test: user A creates an org.
    User B (not a member) tries to access it → 403.
    """
    token_a, _ = await _register(client, "userA@example.com")
    token_b, _ = await _register(client, "userB@example.com")

    # A creates an org
    org = (
        await client.post(
            "/api/v1/organizations",
            json={"name": "A Private Org"},
            headers=_auth(token_a),
        )
    ).json()

    # B tries to access it
    resp = await client.get(
        f"/api/v1/organizations/{org['id']}",
        headers=_auth(token_b),
    )
    assert resp.status_code == 403
    assert "not a member" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_add_member_and_access(client):
    """A adds B as a member. B can then access the org."""
    token_a, _ = await _register(client, "owner@example.com")
    token_b, user_b_id = await _register(client, "staff@example.com")

    # A creates an org
    org = (
        await client.post(
            "/api/v1/organizations",
            json={"name": "Team Org"},
            headers=_auth(token_a),
        )
    ).json()

    # B can't access yet
    r1 = await client.get(
        f"/api/v1/organizations/{org['id']}", headers=_auth(token_b)
    )
    assert r1.status_code == 403

    # A adds B as STAFF
    r2 = await client.post(
        f"/api/v1/organizations/{org['id']}/members",
        json={"email": "staff@example.com", "role": "STAFF"},
        headers=_auth(token_a),
    )
    assert r2.status_code == 201

    # B can now access
    r3 = await client.get(
        f"/api/v1/organizations/{org['id']}", headers=_auth(token_b)
    )
    assert r3.status_code == 200
    assert r3.json()["role"] == "STAFF"


@pytest.mark.asyncio
async def test_staff_cannot_add_members(client):
    """A STAFF member cannot add others (requires ADMIN or OWNER)."""
    token_owner, _ = await _register(client, "owner2@example.com")
    token_staff, _ = await _register(client, "staff2@example.com")
    _, user_c_id = await _register(client, "target@example.com")

    org = (
        await client.post(
            "/api/v1/organizations",
            json={"name": "Roles Org"},
            headers=_auth(token_owner),
        )
    ).json()

    # Add staff2 as STAFF
    await client.post(
        f"/api/v1/organizations/{org['id']}/members",
        json={"email": "staff2@example.com", "role": "STAFF"},
        headers=_auth(token_owner),
    )

    # Staff2 tries to add a member — should be blocked
    r = await client.post(
        f"/api/v1/organizations/{org['id']}/members",
        json={"email": "target@example.com", "role": "STAFF"},
        headers=_auth(token_staff),
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_cannot_remove_only_owner(client):
    token, user_id = await _register(client, "soleowner@example.com")
    org = (
        await client.post(
            "/api/v1/organizations",
            json={"name": "Solo Org"},
            headers=_auth(token),
        )
    ).json()

    members = (
        await client.get(
            f"/api/v1/organizations/{org['id']}/members", headers=_auth(token)
        )
    ).json()

    owner_member_id = members[0]["id"]

    # Try to remove self — should fail
    r = await client.delete(
        f"/api/v1/organizations/{org['id']}/members/{owner_member_id}",
        headers=_auth(token),
    )
    assert r.status_code == 400
    assert "only owner" in r.json()["detail"].lower()
