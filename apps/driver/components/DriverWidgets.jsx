"use client";

export default function DriverWidgets({ items }) {
    const getTone = (tone) => {
        if (tone === "orange") {
            return "border-orange-100 bg-gradient-to-br from-orange-50 to-white";
        }
        if (tone === "green") {
            return "border-green-100 bg-gradient-to-br from-green-50 to-white";
        }
        if (tone === "blue") {
            return "border-blue-100 bg-gradient-to-br from-blue-50 to-white";
        }
        return "border-purple-100 bg-gradient-to-br from-purple-50 to-white";
    };

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {items.map((item, index) => (
                <div
                    key={index}
                    className={`rounded-[26px] border p-5 shadow-sm ${getTone(item.tone)}`}
                >
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                        {item.title}
                    </p>
                    <h3 className="mt-3 text-3xl font-black text-slate-950">
                        {item.value}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">{item.subtitle}</p>
                </div>
            ))}
        </div>
    );
}