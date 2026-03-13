export function getDashboardPathForRole(role) {
  if (role === "seller") {
    return "/seller";
  }

  if (role === "admin") {
    return "/admin";
  }

  return "/account";
}

export function getRoleLabel(role) {
  if (role === "seller") {
    return "Người bán";
  }

  if (role === "admin") {
    return "Quản trị";
  }

  return "Người mua";
}
