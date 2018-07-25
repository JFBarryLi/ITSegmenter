//https://github.com/mourner/kdbush
//Author: Mourner
!function(t, o) {
    "object" == typeof exports && "undefined" != typeof module ? module.exports = o() : "function" == typeof define && define.amd ? define(o) : t.kdbush = o()
}(this, function() {
    "use strict";
    function e(t, o, n, r, i, s) {
        if (!(i - r <= n)) {
            var h = Math.floor((r + i) / 2);
            !function t(o, n, r, i, s, h) {
                for (; i < s; ) {
                    if (600 < s - i) {
                        var e = s - i + 1
                          , u = r - i + 1
                          , f = Math.log(e)
                          , p = .5 * Math.exp(2 * f / 3)
                          , a = .5 * Math.sqrt(f * p * (e - p) / e) * (u - e / 2 < 0 ? -1 : 1)
                          , d = Math.max(i, Math.floor(r - u * p / e + a))
                          , c = Math.min(s, Math.floor(r + (e - u) * p / e + a));
                        t(o, n, r, d, c, h)
                    }
                    var l = n[2 * r + h]
                      , v = i
                      , g = s;
                    for (M(o, n, i, r),
                    n[2 * s + h] > l && M(o, n, i, s); v < g; ) {
                        for (M(o, n, v, g),
                        v++,
                        g--; n[2 * v + h] < l; )
                            v++;
                        for (; n[2 * g + h] > l; )
                            g--
                    }
                    n[2 * i + h] === l ? M(o, n, i, g) : M(o, n, ++g, s),
                    g <= r && (i = g + 1),
                    r <= g && (s = g - 1)
                }
            }(t, o, h, r, i, s % 2),
            e(t, o, n, r, h - 1, s + 1),
            e(t, o, n, h + 1, i, s + 1)
        }
    }
    function M(t, o, n, r) {
        i(t, n, r),
        i(o, 2 * n, 2 * r),
        i(o, 2 * n + 1, 2 * r + 1)
    }
    function i(t, o, n) {
        var r = t[o];
        t[o] = t[n],
        t[n] = r
    }
    function m(t, o, n, r) {
        var i = t - n
          , s = o - r;
        return i * i + s * s
    }
    function s(t, o, n, r, i) {
        o = o || h,
        n = n || u,
        i = i || Array,
        this.nodeSize = r || 64,
        this.points = t,
        this.ids = new i(t.length),
        this.coords = new i(2 * t.length);
        for (var s = 0; s < t.length; s++)
            this.ids[s] = s,
            this.coords[2 * s] = o(t[s]),
            this.coords[2 * s + 1] = n(t[s]);
        e(this.ids, this.coords, this.nodeSize, 0, this.ids.length - 1, 0)
    }
    function h(t) {
        return t[0]
    }
    function u(t) {
        return t[1]
    }
    return s.prototype = {
        range: function(t, o, n, r) {
            return function(t, o, n, r, i, s, h) {
                for (var e, u, f = [0, t.length - 1, 0], p = []; f.length; ) {
                    var a = f.pop()
                      , d = f.pop()
                      , c = f.pop();
                    if (d - c <= h)
                        for (var l = c; l <= d; l++)
                            e = o[2 * l],
                            u = o[2 * l + 1],
                            n <= e && e <= i && r <= u && u <= s && p.push(t[l]);
                    else {
                        var v = Math.floor((c + d) / 2);
                        e = o[2 * v],
                        u = o[2 * v + 1],
                        n <= e && e <= i && r <= u && u <= s && p.push(t[v]);
                        var g = (a + 1) % 2;
                        (0 === a ? n <= e : r <= u) && (f.push(c),
                        f.push(v - 1),
                        f.push(g)),
                        (0 === a ? e <= i : u <= s) && (f.push(v + 1),
                        f.push(d),
                        f.push(g))
                    }
                }
                return p
            }(this.ids, this.coords, t, o, n, r, this.nodeSize)
        },
        within: function(t, o, n) {
            return function(t, o, n, r, i, s) {
                for (var h = [0, t.length - 1, 0], e = [], u = i * i; h.length; ) {
                    var f = h.pop()
                      , p = h.pop()
                      , a = h.pop();
                    if (p - a <= s)
                        for (var d = a; d <= p; d++)
                            m(o[2 * d], o[2 * d + 1], n, r) <= u && e.push(t[d]);
                    else {
                        var c = Math.floor((a + p) / 2)
                          , l = o[2 * c]
                          , v = o[2 * c + 1];
                        m(l, v, n, r) <= u && e.push(t[c]);
                        var g = (f + 1) % 2;
                        (0 === f ? n - i <= l : r - i <= v) && (h.push(a),
                        h.push(c - 1),
                        h.push(g)),
                        (0 === f ? l <= n + i : v <= r + i) && (h.push(c + 1),
                        h.push(p),
                        h.push(g))
                    }
                }
                return e
            }(this.ids, this.coords, t, o, n, this.nodeSize)
        }
    },
    function(t, o, n, r, i) {
        return new s(t,o,n,r,i)
    }
});