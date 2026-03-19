import * as d from "dynz";

export const registrationFormSchema = d.object({
    private: false,
    fields: {
        name: d.string({
            rules: [d.minLength(d.v(3))],
        }),
        company: d.string({
            rules: [],
        }),
        email: d.string({
            rules: [
                d.email(),
                d.conditional({
                    when: d.matches(d.ref("company"), d.v("\\bapple\\b"), "i"),
                    then: d.regex("@apple.com$", "useCompanyMail"),
                }),
                d.conditional({
                    when: d.matches(d.ref("company"), d.v("\\microsoft\\b"), "i"),
                    then: d.regex("@microsoft.com$", "useCompanyMail"),
                }),
            ],
        }),
        attendanceType: d.options({
            default: "Virtual",
            options: ["inPerson", "virtual", "hybrid"],
        }),
        accomidationRequired: d.boolean({
            coerce: true,
            included: d.eq(d.ref("attendanceType"), d.v("inPerson")),
        }),
        workshopPreferences: d.options({
            options: ["AI & Machine Learning", "Web Development", "Data Science", "Cybersecurity"],
            included: d.or(d.eq(d.ref("attendanceType"), d.v("inPerson")), d.eq(d.ref("attendanceType"), d.v("hybrid"))),
        }),
        dietry: d.object({
            included: d.eq(d.ref("attendanceType"), d.v("inPerson")),
            fields: {
                restrictions: d.boolean({
                    coerce: true,
                }),
                details: d.string({
                    included: d.eq(d.ref("$.dietry.restrictions"), d.v(true)),
                }),
            },
        }),
        professionalLevel: d.options({
            options: ["Student", "Junior Professional", "Senior Professional", "Executive"],
        }),
        studentInstitution: d.string({
            included: d.eq(d.ref("professionalLevel"), d.v("Student")),
        }),
    },
});


export function runRegistrationForm() {

    const result = d.validate(registrationFormSchema, undefined, {
        name: 'foo',
        company: 'apple',
        email: 'ruben@apple.com',
        attendanceType: 'virtual',
        professionalLevel: 'Student',
        studentInstitution: 'foo',
        // dietry: {
        //   restrictions: false
        // }
    })

    console.log('-----');
    console.log(result)
}

