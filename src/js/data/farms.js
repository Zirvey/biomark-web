// src/js/data/farms.js
export const farms = [
    {
        id: 'hoki-farma',
        name: 'HOKI FARMA',
        location: '📍 Южная Чехия',
        icon: '🥚',
        gradient: 'from-amber-100 to-yellow-200',
        rating: 4.9,
        reviews: 156,
        description: 'Vajíčka, která chutnají po slunci, svobodě a poctivé práci. Специализируемся на производстве органических яиц и куриного мяса. Наши куры свободно выгуливаются на свежем воздухе и получают только натуральные корма.',
        productsCount: 4,
        followers: 1250,
        established: '2015',
        email: 'info@hokifarma.cz',
        phone: '+420 123 456 789',
        website: 'www.hokifarma.cz',
        social: {
            facebook: '#',
            instagram: '#',
            twitter: '#'
        }
    },
    {
        id: 'bio-zelenina-uhrineves',
        name: 'BIO zelenina Uhříněves',
        location: '📍 Моравия',
        icon: '🍎',
        gradient: 'from-red-100 to-rose-200',
        rating: 5.0,
        reviews: 203,
        description: 'V současné době nabízíme široký sortiment BIO zeleniny a ovoce. Уже более 20 лет мы выращиваем органические овощи и фрукты без использования пестицидов и химических удобрений.',
        productsCount: 12,
        followers: 2100,
        established: '2003',
        email: 'kontakt@biouhrineves.cz',
        phone: '+420 234 567 890',
        website: 'www.biouhrineves.cz',
        social: {
            facebook: '#',
            instagram: '#',
            twitter: '#'
        }
    },
    {
        id: 'farma-kopecek',
        name: 'Farma Kopeček',
        location: '📍 Поллаби',
        icon: '🥬',
        gradient: 'from-green-100 to-emerald-200',
        rating: 4.8,
        reviews: 178,
        description: 'Farmy Čerstvě utrženo najdete v Olomouckém kraji - V Smržicích, v Kostelci na Haní, a dále v Mutěnicích, Velkých Němčicích, Hovoranech, Postoupkách, Velkých Bílovicích a Skrýšově. Сеть фермерских хозяйств, специализирующихся на свежей зелени и овощах.',
        productsCount: 8,
        followers: 1800,
        established: '2010',
        email: 'info@farmakopecek.cz',
        phone: '+420 345 678 901',
        website: 'www.farmakopecek.cz',
        social: {
            facebook: '#',
            instagram: '#',
            twitter: '#'
        }
    },
    {
        id: 'farma-rodiny-nemcovy',
        name: 'Farma rodiny Němcovy',
        location: '📍 Крконоше',
        icon: '🐄',
        gradient: 'from-pink-100 to-rose-200',
        rating: 4.9,
        reviews: 145,
        description: 'Máme nejširší záběr v chování hospodářských zvířat - krávy na mléko, hovězí maso, kuřecí maso. Jsme jedna z mála farem, která dává na internet videa a fotky z farmy a výroбы. Семейная ферма с полным циклом производства.',
        productsCount: 6,
        followers: 1650,
        established: '2008',
        email: 'nemcovy@farma.cz',
        phone: '+420 456 789 012',
        website: 'www.farma-nemcovy.cz',
        social: {
            facebook: '#',
            instagram: '#',
            twitter: '#'
        }
    }
];

/**
 * Получить все фермы
 * @returns {Array}
 */
export function getAllFarms() {
    return farms;
}

/**
 * Получить ферму по ID
 * @param {string} farmId
 * @returns {Object|undefined}
 */
export function getFarmById(farmId) {
    return farms.find(f => f.id === farmId);
}

/**
 * Получить ферму по имени
 * @param {string} farmName
 * @returns {Object|undefined}
 */
export function getFarmByName(farmName) {
    return farms.find(f => f.name === farmName);
}
