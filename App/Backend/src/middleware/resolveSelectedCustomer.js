/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 12/07/2026
**/

function resolveSelectedCustomer(req) {
    const allowed   = req.user?.customerIds ?? [];
    const requested = req.query.customerId;
    if (requested) {
        return allowed.includes(requested) ? requested : null;
    }
    return allowed[0] ?? null;
}

module.exports = { resolveSelectedCustomer };