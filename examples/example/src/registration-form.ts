import * as d from "dynz";

const registrationFormSchema = d.object({
  name: d.string().min(d.v(3)),
  company: d.string(),
  email: d.string()
    .email()
    .when(
      d.matches(d.ref("company"), d.v("\\bapple\\b"), "i"),
      (rules) => rules.regex("@apple.com$", "useCompanyMail")
    )
    .when(
      d.matches(d.ref("company"), d.v("\\microsoft\\b"), "i"),
      (rules) => rules.regex("@microsoft.com$", "useCompanyMail")
    ),
  attendanceType: d.options(["inPerson", {
    value: "virtual",
    enabled: d.neq(d.ref("company"), d.v("\\bapple\\b"))
  }, {
      value: "hybrid",
      enabled: d.neq(d.ref("company"), d.v("\\bapple\\b"))
    }]),
  accomidationRequired: d.boolean()
    .setIncluded(d.eq(d.ref("attendanceType"), d.v("inPerson")))
    .setCoerce(true),
  workshopPreferences: d.options(["AI & Machine Learning", "Web Development", "Data Science", "Cybersecurity"])
    .setIncluded(d.or(d.eq(d.ref("attendanceType"), d.v("inPerson")), d.eq(d.ref("attendanceType"), d.v("hybrid")))),
  dietry: d.object({
    restrictions: d.boolean().setCoerce(true),
    details: d.string()
      .setIncluded(d.eq(d.ref("$.dietry.restrictions"), d.v(true)))
  }).setIncluded(d.eq(d.ref("attendanceType"), d.v("inPerson")),),
  professionalLevel: d.options(["Student", "Junior Professional", "Senior Professional", "Executive"]),
  studentInstitution: d.string()
})

export function runRegistrationForm() {
  const result = d.validate(registrationFormSchema, undefined, {
    name: "foo",
    company: "apple",
    email: "ruben@apple.com",
    attendanceType: "virtual",
    professionalLevel: "Student",
    studentInstitution: "foo",
    // dietry: {
    //   restrictions: false
    // }
  });

  console.log("-----");
  console.log(result);
}
